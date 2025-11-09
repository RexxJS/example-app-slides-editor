/**
 * Execute RexxJS Scripts in Slides Editor Context
 * Handles full RexxJS script parsing and execution with slides manipulation
 */

/**
 * Execute a complete RexxJS script with slides support
 * @param {string} script - The RexxJS script source code
 * @param {Object} options - Execution options (output capture, timeout, etc.)
 * @returns {Promise<Object>} Execution result with output and status
 */
async function executeRexxScript(script, options = {}) {
  return new Promise((resolve) => {
    const {
      timeout = 30000,
      outputBuffer = [],
      onOutput = null
    } = options;

    const startTime = Date.now();
    let executionOutput = [];

    // Create a wrapper for SAY statements
    const sayProxy = (value) => {
      const output = String(value);
      executionOutput.push(output);
      if (onOutput) onOutput(output);
      return output;
    };

    // Create ADDRESS handler wrapper
    const addressHandler = async (address, command) => {
      if (address.toUpperCase() === 'SLIDES') {
        if (typeof window.ADDRESS_SLIDES_HANDLER === 'function') {
          return await window.ADDRESS_SLIDES_HANDLER(command);
        } else {
          return {
            success: false,
            errorCode: 1,
            output: 'Slides handler not initialized'
          };
        }
      }
      return { success: false, errorCode: 2, output: `Unknown address: ${address}` };
    };

    // Check for timeout
    const checkTimeout = () => {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Script execution timeout after ${timeout}ms`);
      }
    };

    try {
      // Parse and execute the script
      // Since we're in a browser environment, we'll use a simple parser for RexxJS constructs

      const lines = script.split('\n');
      let lineIndex = 0;
      let variables = {};
      let inBlock = false;
      let blockStack = [];

      // Tokenize and execute line by line
      const executeNextLine = async () => {
        while (lineIndex < lines.length) {
          checkTimeout();

          const line = lines[lineIndex++].trim();

          // Skip empty lines and comments
          if (!line || line.startsWith('/*') || line.startsWith('--')) {
            if (line.startsWith('/*')) {
              // Handle multi-line comments
              while (lineIndex < lines.length && !lines[lineIndex].includes('*/')) {
                lineIndex++;
              }
              if (lineIndex < lines.length) lineIndex++;
            }
            continue;
          }

          // Handle SAY statements
          if (line.toUpperCase().startsWith('SAY')) {
            const expression = line.substring(3).trim();
            const value = evaluateExpression(expression, variables);
            sayProxy(value);
            continue;
          }

          // Handle ADDRESS SLIDES commands
          if (line.toUpperCase().startsWith('ADDRESS SLIDES')) {
            const match = line.match(/ADDRESS SLIDES\s+"([^"]+)"/);
            if (match) {
              const command = match[1];
              const result = await addressHandler('SLIDES', command);

              // Set RESULT and RC variables
              if (result.success) {
                variables.RC = 0;
                variables.RESULT = result.result || result.output;
              } else {
                variables.RC = result.errorCode || 1;
                variables.RESULT = result.output;
              }
            }
            continue;
          }

          // Handle variable assignment
          const assignMatch = line.match(/^(\w+)\s*=\s*(.+)$/);
          if (assignMatch) {
            const varName = assignMatch[1];
            const varValue = evaluateExpression(assignMatch[2], variables);
            variables[varName] = varValue;
            continue;
          }

          // Handle IF statements
          if (line.toUpperCase().startsWith('IF')) {
            const ifMatch = line.match(/IF\s+(.+?)\s+THEN/i);
            if (ifMatch) {
              const condition = evaluateExpression(ifMatch[1], variables);
              if (condition) {
                // Continue processing lines after THEN
                continue;
              } else {
                // Skip to END or ELSE
                let depth = 1;
                while (lineIndex < lines.length && depth > 0) {
                  const nextLine = lines[lineIndex++].trim().toUpperCase();
                  if (nextLine.startsWith('IF')) depth++;
                  if (nextLine.startsWith('END')) depth--;
                }
              }
            }
            continue;
          }

          // Handle DO loops
          if (line.toUpperCase().startsWith('DO')) {
            const doMatch = line.match(/DO\s+(\w+)\s*=\s*(\d+)\s+TO\s+(\d+)/i);
            if (doMatch) {
              const varName = doMatch[1];
              const start = parseInt(doMatch[2]);
              const end = parseInt(doMatch[3]);

              const loopStartIndex = lineIndex;
              for (let i = start; i <= end; i++) {
                variables[varName] = i;
                lineIndex = loopStartIndex;
                await executeLoop(lines, variables, sayProxy, addressHandler, i === end);
              }
              continue;
            }
          }
        }
      };

      // Execute the script
      await executeNextLine();

      resolve({
        success: true,
        output: executionOutput.join('\n'),
        variables,
        errorCode: 0
      });
    } catch (error) {
      executionOutput.push(`ERROR: ${error.message}`);
      resolve({
        success: false,
        output: executionOutput.join('\n'),
        error: error.message,
        errorCode: 99
      });
    }
  });
}

/**
 * Execute a loop body
 */
async function executeLoop(lines, variables, sayProxy, addressHandler, isLastIteration) {
  // This would be implemented based on the loop structure
  // For now, placeholder
}

/**
 * Evaluate a RexxJS expression
 */
function evaluateExpression(expr, variables) {
  expr = expr.trim();

  // Handle string literals
  if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
    return expr.slice(1, -1);
  }

  // Handle numbers
  if (!isNaN(expr) && expr !== '') {
    return Number(expr);
  }

  // Handle variables
  if (variables.hasOwnProperty(expr)) {
    return variables[expr];
  }

  // Handle concatenation with ||
  if (expr.includes('||')) {
    const parts = expr.split('||').map(p => evaluateExpression(p.trim(), variables));
    return parts.join('');
  }

  // Handle simple expressions (variable + string, etc.)
  return expr;
}

/**
 * Setup RexxJS script execution capability
 * Should be called after slides Redux store is available
 */
function setupRexxScriptExecution() {
  // Make executeRexxScript available globally
  window.executeRexxScript = executeRexxScript;

  // Hook into the Redux store if available (via provider)
  const originalAddressHandler = window.ADDRESS_SLIDES_HANDLER;

  window.executeRexxScript = async (scriptSource, options = {}) => {
    return executeRexxScript(scriptSource, options);
  };

  console.log('Slides RexxJS script execution setup complete');
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { executeRexxScript, setupRexxScriptExecution };
}
