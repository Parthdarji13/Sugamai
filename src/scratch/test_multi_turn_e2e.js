const { spawn } = require('child_process');
const http = require('http');

async function testMultiTurnE2E() {
  console.log('Starting Multi-Turn E2E Verification...');
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

    const questions = [
      { num: 'Q1', text: 'PM Kisan eligibility kya hai?' },
      { num: 'Q2', text: 'PM Kisan ke liye documents kya chahiye?' },
      { num: 'Q3', text: 'Ayushman Bharat eligibility kya hai?' }
    ];

    for (let index = 0; index < questions.length; index++) {
      const q = questions[index];
      const expectedBubbles = (index + 1) * 2;
      console.log(`\n--- [${q.num}] Submitting: "${q.text}" ---`);

      // 1. Focus input via click
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
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
      await new Promise(res => setTimeout(res, 200));

      // 2. Type text using native input value setter and event dispatch
      await send('Runtime.evaluate', {
        expression: `
          (() => {
            const input = document.querySelector('input');
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            nativeInputValueSetter.call(input, ${JSON.stringify(q.text)});
            input.dispatchEvent(new Event('input', { bubbles: true }));
            const form = input.closest('form');
            form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          })()
        `
      });

      // 3. Wait until stream finishes completely for this question
      console.log(`Waiting for ${q.num} stream to complete (expected bubbles: ${expectedBubbles})...`);
      let completed = false;
      for (let i = 0; i < 30; i++) {
        await new Promise(res => setTimeout(res, 1000));
        const status = await send('Runtime.evaluate', {
          expression: `
            (() => {
              const bubbles = document.querySelectorAll('.anim-bubble');
              const input = document.querySelector('input');
              const lastBubble = bubbles[bubbles.length - 1];
              return {
                bubbleCount: bubbles.length,
                inputDisabled: input ? input.disabled : true,
                lastBubbleTextLength: lastBubble ? lastBubble.textContent.length : 0
              };
            })()
          `,
          returnByValue: true
        });

        if (status.result.value && status.result.value.bubbleCount >= expectedBubbles && !status.result.value.inputDisabled) {
          console.log(`✓ ${q.num} completed! Bubble count: ${status.result.value.bubbleCount}`);
          completed = true;
          await new Promise(res => setTimeout(res, 1000));
          break;
        }
      }

      if (!completed) {
        console.error(`❌ ${q.num} timed out waiting for completion!`);
        ws.close();
        edgeProc.kill();
        process.exit(1);
      }
    }

    console.log('\n========================================');
    console.log(' SUCCESS! Q1, Q2, and Q3 submitted and responded successfully without refresh!');
    console.log('========================================');

    ws.close();
    edgeProc.kill();
    process.exit(0);
  });
}

testMultiTurnE2E().catch(console.error);
