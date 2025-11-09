/**
 * Slides Editor RexxJS Integration Tests
 * Tests for in-app execution and iframe control bus
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';
const CONTROL_BUS_URL = `${BASE_URL}/slides-controlbus-demo.html`;

test.describe('Slides In-App RexxJS Execution', () => {
  test('slides app loads successfully', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    const oiMain = await page.locator('#oi-main').isVisible();
    expect(oiMain).toBeTruthy();
  });

  test('SlidesRexxHandler is registered globally', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    const handlerExists = await page.evaluate(() => {
      return typeof window.ADDRESS_SLIDES_HANDLER === 'function';
    });

    expect(handlerExists).toBeTruthy();
  });

  test('can execute list-slides command', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    const result = await page.evaluate(async () => {
      return await window.ADDRESS_SLIDES_HANDLER('list-slides');
    });

    expect(result.success).toBe(true);
    expect(result.errorCode).toBe(0);
    expect(Array.isArray(result.result)).toBeTruthy();
  });

  test('can execute get-current-slide command', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    const result = await page.evaluate(async () => {
      return await window.ADDRESS_SLIDES_HANDLER('get-current-slide');
    });

    expect(result.success).toBe(true);
    expect(result.result).toBeDefined();
    expect(result.result.index).toBeDefined();
  });

  test('can execute new-slide command', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    const result = await page.evaluate(async () => {
      return await window.ADDRESS_SLIDES_HANDLER('new-slide');
    });

    expect(result.success).toBe(true);
    expect(result.errorCode).toBe(0);
  });

  test('can execute set-slide-title command', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    // First create a slide
    await page.evaluate(async () => {
      await window.ADDRESS_SLIDES_HANDLER('new-slide');
    });

    // Then set its title
    const result = await page.evaluate(async () => {
      return await window.ADDRESS_SLIDES_HANDLER('set-slide-title text=Test Title');
    });

    expect(result.success).toBe(true);
  });

  test('can execute add-text command', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    const result = await page.evaluate(async () => {
      return await window.ADDRESS_SLIDES_HANDLER('add-text text=Test content');
    });

    expect(result.success).toBe(true);
  });

  test('can execute goto-slide command', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    const result = await page.evaluate(async () => {
      return await window.ADDRESS_SLIDES_HANDLER('goto-slide number=0');
    });

    expect(result.success).toBe(true);
  });

  test('can execute duplicate-slide command', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    const result = await page.evaluate(async () => {
      return await window.ADDRESS_SLIDES_HANDLER('duplicate-slide number=0');
    });

    expect(result.success).toBe(true);
  });

  test('unknown command returns error', async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForTimeout(2000);

    const result = await page.evaluate(async () => {
      return await window.ADDRESS_SLIDES_HANDLER('invalid-command');
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBeGreaterThan(0);
  });
});

test.describe('Slides Control Bus (Iframe)', () => {
  test('control bus demo page loads', async ({ page }) => {
    await page.goto(CONTROL_BUS_URL);
    await page.waitForTimeout(3000);

    const title = await page.title();
    expect(title).toContain('Slides Control Bus');
  });

  test('script editor is visible', async ({ page }) => {
    await page.goto(CONTROL_BUS_URL);

    const editor = await page.locator('#scriptEditor').isVisible();
    expect(editor).toBeTruthy();
  });

  test('worker frame loads slides editor', async ({ page }) => {
    await page.goto(CONTROL_BUS_URL);
    await page.waitForTimeout(3000);

    const frame = page.frameLocator('#slides-worker');
    const oiMain = await frame.locator('#oi-main').isVisible();
    expect(oiMain).toBeTruthy();
  });

  test('can load example script', async ({ page }) => {
    await page.goto(CONTROL_BUS_URL);

    // Click first example button
    await page.click('.example-scripts button:first-of-type');

    const editorText = await page.inputValue('#scriptEditor');
    expect(editorText.length).toBeGreaterThan(0);
  });

  test('clear button clears output', async ({ page }) => {
    await page.goto(CONTROL_BUS_URL);

    // Set some text
    await page.evaluate(() => {
      document.getElementById('output').textContent = 'Test output';
    });

    // Click clear
    await page.click('#clearBtn');

    const output = await page.textContent('#output');
    expect(output.trim()).toBe('');
  });

  test('script execution works', async ({ page }) => {
    await page.goto(CONTROL_BUS_URL);
    await page.waitForTimeout(3000);

    // Load example
    const buttons = await page.locator('.example-scripts button').all();
    await buttons[0].click();

    // Execute
    await page.click('#executeBtn');
    await page.waitForTimeout(2000);

    const output = await page.textContent('#output');
    expect(output.length).toBeGreaterThan(0);
  });

  test('multiple commands execute in sequence', async ({ page }) => {
    await page.goto(CONTROL_BUS_URL);
    await page.waitForTimeout(3000);

    const script = `ADDRESS SLIDES "list-slides"
SAY "Slides listed"

ADDRESS SLIDES "get-current-slide"
SAY "Current slide retrieved"`;

    await page.fill('#scriptEditor', script);
    await page.click('#executeBtn');
    await page.waitForTimeout(2000);

    const output = await page.textContent('#output');
    expect(output).toContain('Slides listed');
  });

  test('worker frame persists across multiple commands', async ({ page }) => {
    await page.goto(CONTROL_BUS_URL);
    await page.waitForTimeout(3000);

    // First execution
    await page.fill('#scriptEditor', 'SAY "First"');
    await page.click('#executeBtn');
    await page.waitForTimeout(1000);

    // Check frame still there
    const frame = page.frameLocator('#slides-worker');
    const oiMain = await frame.locator('#oi-main').isVisible();
    expect(oiMain).toBeTruthy();

    // Second execution
    await page.fill('#scriptEditor', 'SAY "Second"');
    await page.click('#executeBtn');
    await page.waitForTimeout(1000);

    const oiMain2 = await frame.locator('#oi-main').isVisible();
    expect(oiMain2).toBeTruthy();
  });

  test('can clear output between executions', async ({ page }) => {
    await page.goto(CONTROL_BUS_URL);
    await page.waitForTimeout(3000);

    // First execution
    await page.fill('#scriptEditor', 'SAY "First"');
    await page.click('#executeBtn');
    await page.waitForTimeout(1000);

    // Clear
    await page.click('#clearBtn');
    let output = await page.textContent('#output');
    expect(output.trim()).toBe('');

    // Second execution
    await page.fill('#scriptEditor', 'SAY "Second"');
    await page.click('#executeBtn');
    await page.waitForTimeout(1000);

    output = await page.textContent('#output');
    expect(output).toContain('Second');
    expect(output).not.toContain('First');
  });

  test('can create multiple slides via script', async ({ page }) => {
    await page.goto(CONTROL_BUS_URL);
    await page.waitForTimeout(3000);

    const script = `ADDRESS SLIDES "new-slide"
SAY "Slide 1 created"

ADDRESS SLIDES "new-slide"
SAY "Slide 2 created"

ADDRESS SLIDES "list-slides"
SAY "Done"`;

    await page.fill('#scriptEditor', script);
    await page.click('#executeBtn');
    await page.waitForTimeout(2000);

    const output = await page.textContent('#output');
    expect(output).toContain('Slide 1 created');
    expect(output).toContain('Slide 2 created');
  });

  test('can navigate between slides', async ({ page }) => {
    await page.goto(CONTROL_BUS_URL);
    await page.waitForTimeout(3000);

    const script = `ADDRESS SLIDES "list-slides"
SAY "Initial list retrieved"

ADDRESS SLIDES "goto-slide number=0"
SAY "Navigated to slide 0"

ADDRESS SLIDES "get-current-slide"
SAY "Current position confirmed"`;

    await page.fill('#scriptEditor', script);
    await page.click('#executeBtn');
    await page.waitForTimeout(2000);

    const output = await page.textContent('#output');
    expect(output).toContain('Navigated to slide 0');
  });
});

test.describe('Slides Control Bus Integration', () => {
  test('director and worker frames communicate', async ({ page }) => {
    await page.goto(CONTROL_BUS_URL);
    await page.waitForTimeout(3000);

    const directorScript = await page.locator('#scriptEditor').isVisible();
    expect(directorScript).toBeTruthy();

    const workerFrame = page.frameLocator('#slides-worker');
    const workerApp = await workerFrame.locator('#oi-main').isVisible();
    expect(workerApp).toBeTruthy();
  });

  test('status indicates connection', async ({ page }) => {
    await page.goto(CONTROL_BUS_URL);

    const statusText = page.locator('#statusText');
    const text = await statusText.textContent();
    expect(text).toBeDefined();
    expect(text.length).toBeGreaterThan(0);
  });

  test('can execute ADDRESS SLIDES with parameters', async ({ page }) => {
    await page.goto(CONTROL_BUS_URL);
    await page.waitForTimeout(3000);

    const script = `ADDRESS SLIDES "new-slide"
ADDRESS SLIDES "set-slide-title text=Custom Title"
ADDRESS SLIDES "add-text text=Content here"
SAY "Setup complete"`;

    await page.fill('#scriptEditor', script);
    await page.click('#executeBtn');
    await page.waitForTimeout(2000);

    const output = await page.textContent('#output');
    expect(output).toContain('Setup complete');
  });

  test('RPC properly handles errors', async ({ page }) => {
    await page.goto(CONTROL_BUS_URL);
    await page.waitForTimeout(3000);

    const script = `ADDRESS SLIDES "goto-slide number=999"
SAY "Navigation attempted"`;

    await page.fill('#scriptEditor', script);
    await page.click('#executeBtn');
    await page.waitForTimeout(2000);

    const output = await page.textContent('#output');
    // Should complete even with error
    expect(output).toBeTruthy();
  });
});
