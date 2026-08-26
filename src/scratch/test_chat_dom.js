const { spawn } = require('child_process');
const http = require('http');

async function runTest() {
  console.log('Launching Edge in headless mode with remote debugging...');
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    'http://localhost:3000'
  ]);

  // Wait for remote debugging port
  await new Promise(res => setTimeout(res, 2000));

  // Get WebSocket debugger URL
  const versionInfo = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/version', res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  console.log('Edge DevTools URL:', versionInfo.webSocketDebuggerUrl);

  const listPages = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/list', res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const page = listPages.find(p => p.type === 'page');
  console.log('Target Page:', page ? page.title : 'None');

  const wsUrl = page.webSocketDebuggerUrl;
  const ws = new WebSocket(wsUrl);

  let id = 1;
  const pending = new Map();

  ws.addEventListener('open', async () => {
    console.log('Connected to CDP WebSocket');
    
    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const reqId = id++;
        pending.set(reqId, { resolve, reject });
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    ws.addEventListener('message', evt => {
      const msg = JSON.parse(evt.data);
      if (msg.id && pending.has(msg.id)) {
        const { resolve } = pending.get(msg.id);
        pending.delete(msg.id);
        resolve(msg.result);
      }
    });

    await send('Runtime.enable');
    await send('DOM.enable');

    console.log('Navigating to http://localhost:3000...');
    await send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(res => setTimeout(res, 2000));

    // Step 1: Inspect initial input
    const eval1 = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const input = document.querySelector('input');
          return {
            exists: !!input,
            placeholder: input ? input.placeholder : null,
            disabled: input ? input.disabled : null,
            value: input ? input.value : null
          };
        })()
      `,
      returnByValue: true
    });
    console.log('Initial Input State:', eval1.result.value);

    // Step 2: Type Q1 and submit
    console.log('Submitting Q1: "PM Kisan eligibility kya hai?"');
    await send('Runtime.evaluate', {
      expression: `
        (() => {
          const input = document.querySelector('input');
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
          nativeInputValueSetter.call(input, "PM Kisan eligibility kya hai?");
          input.dispatchEvent(new Event('input', { bubbles: true }));
          const form = input.closest('form');
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        })()
      `
    });

    // Step 3: Poll streaming status and wait for stream completion
    console.log('Waiting for AI response stream to finish...');
    for (let i = 0; i < 40; i++) {
      await new Promise(res => setTimeout(res, 1000));
      const status = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const bubbles = Array.from(document.querySelectorAll('.anim-bubble'));
            const input = document.querySelector('input');
            const button = document.querySelector('button[type="submit"]');
            return {
              bubbleCount: bubbles.length,
              inputDisabled: input ? input.disabled : null,
              inputValue: input ? input.value : null,
              activeElementTag: document.activeElement ? document.activeElement.tagName : null,
              activeElementPlaceholder: document.activeElement ? document.activeElement.placeholder : null
            };
          })()
        `,
        returnByValue: true
      });
      console.log(`[${i}s] Status:`, JSON.stringify(status.result.value));
      
      // Check if streaming completed (input disabled is false and assistant bubble has text)
      if (status.result.value && status.result.value.bubbleCount >= 2 && !status.result.value.inputDisabled) {
        console.log('Stream completed! Waiting 1s stability...');
        await new Promise(res => setTimeout(res, 1000));
        break;
      }
    }

    // Step 4: Attempt to focus and type Q2
    console.log('Attempting Q2 input...');
    const q2Result = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const inputs = document.querySelectorAll('input');
          const lastInput = inputs[inputs.length - 1];
          if (!lastInput) return { error: 'No input found' };
          
          lastInput.focus();
          lastInput.value = "PM Kisan ke liye documents kya chahiye?";
          lastInput.dispatchEvent(new Event('input', { bubbles: true }));
          
          const rect = lastInput.getBoundingClientRect();
          const elementAtPoint = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
          
          return {
            totalInputs: inputs.length,
            disabled: lastInput.disabled,
            readOnly: lastInput.readOnly,
            value: lastInput.value,
            focused: document.activeElement === lastInput,
            activeElement: document.activeElement ? document.activeElement.tagName + '.' + document.activeElement.className : null,
            elementAtPoint: elementAtPoint ? elementAtPoint.tagName + '.' + elementAtPoint.className : null,
            pointerEvents: window.getComputedStyle(lastInput).pointerEvents,
            formDisabled: lastInput.closest('form') ? lastInput.closest('form').disabled : null
          };
        })()
      `,
      returnByValue: true
    });

    console.log('Q2 Input Evaluation Result:', JSON.stringify(q2Result.result.value, null, 2));

    ws.close();
    edgeProc.kill();
    process.exit(0);
  });
}

runTest().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
