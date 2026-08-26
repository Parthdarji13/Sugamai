const { spawn } = require('child_process');
const http = require('http');

async function testMouseClick() {
  console.log('Testing mouse click behavior...');
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    'http://localhost:3000'
  ]);

  await new Promise(res => setTimeout(res, 2000));

  const listPages = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9222/json/list', res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });

  const page = listPages.find(p => p.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);

  let id = 1;
  const pending = new Map();

  ws.addEventListener('open', async () => {
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
    await send('Page.navigate', { url: 'http://localhost:3000' });
    await new Promise(res => setTimeout(res, 2000));

    // Submit Q1
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

    // Wait for stream to finish
    while (true) {
      await new Promise(res => setTimeout(res, 1000));
      const res = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const bubbles = document.querySelectorAll('.anim-bubble');
            const input = document.querySelector('input');
            return bubbles.length >= 2 && input && !input.disabled;
          })()
        `,
        returnByValue: true
      });
      if (res.result.value) break;
    }

    console.log('Stream finished. Now getting input bounding rect...');
    const box = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const input = document.querySelector('input');
          const rect = input.getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        })()
      `,
      returnByValue: true
    });

    const { x, y } = box.result.value;
    console.log(`Clicking at coordinates (${x}, ${y})...`);

    // Perform REAL CDP Mouse Click
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });

    await new Promise(res => setTimeout(res, 500));

    const clickState = await send('Runtime.evaluate', {
      expression: `
        (() => {
          const input = document.querySelector('input');
          return {
            activeElementIsInput: document.activeElement === input,
            activeElementTag: document.activeElement ? document.activeElement.tagName : null,
            activeElementClass: document.activeElement ? document.activeElement.className : null
          };
        })()
      `,
      returnByValue: true
    });

    console.log('State after real mouse click:', clickState.result.value);

    ws.close();
    edgeProc.kill();
    process.exit(0);
  });
}

testMouseClick().catch(console.error);
