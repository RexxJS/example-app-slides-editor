/**
 * Slides RexxJS Handler
 * Provides ADDRESS SLIDES command support for slide manipulation via Redux actions
 */

class SlidesRexxHandler {
  constructor(store) {
    this.store = store;
    this.commandRegistry = {
      'new-slide': this.newSlide.bind(this),
      'set-slide-title': this.setSlideTitle.bind(this),
      'add-text': this.addText.bind(this),
      'list-slides': this.listSlides.bind(this),
      'get-current-slide': this.getCurrentSlide.bind(this),
      'goto-slide': this.gotoSlide.bind(this),
      'delete-slide': this.deleteSlide.bind(this),
      'duplicate-slide': this.duplicateSlide.bind(this),
      'undo': this.undo.bind(this),
      'redo': this.redo.bind(this),
      'get-slides': this.getSlides.bind(this),
      'get-slide-info': this.getSlideInfo.bind(this)
    };

    this.commandHistory = [];
    this.historyIndex = -1;
  }

  /**
   * Main command handler - parses command string and executes
   */
  async run(commandStr) {
    try {
      // Parse command: "command-name param1=value1 param2=value2"
      const parts = commandStr.trim().split(/\s+/);
      const command = parts[0];
      const params = this.parseParams(parts.slice(1));

      if (!this.commandRegistry[command]) {
        return {
          success: false,
          errorCode: 2,
          output: `Unknown command: ${command}`,
          result: null
        };
      }

      const result = await this.commandRegistry[command](params);

      // Track successful state-changing commands for undo/redo
      if (result.success && this.isStateChanging(command)) {
        // Remove any redo history
        this.commandHistory = this.commandHistory.slice(0, this.historyIndex + 1);
        this.commandHistory.push({ command, params, state: this.captureState() });
        this.historyIndex = this.commandHistory.length - 1;
      }

      return result;
    } catch (error) {
      return {
        success: false,
        errorCode: 99,
        output: `Error: ${error.message}`,
        result: null
      };
    }
  }

  parseParams(paramStrings) {
    const params = {};
    paramStrings.forEach(str => {
      const [key, value] = str.split('=');
      if (key && value !== undefined) {
        if (value === 'true') params[key] = true;
        else if (value === 'false') params[key] = false;
        else if (!isNaN(value) && value !== '') params[key] = Number(value);
        else params[key] = value.replace(/['\"]/g, '');
      }
    });
    return params;
  }

  isStateChanging(command) {
    const stateChangingCommands = ['new-slide', 'set-slide-title', 'add-text', 'delete-slide', 'duplicate-slide'];
    return stateChangingCommands.includes(command);
  }

  captureState() {
    const state = this.store.getState();
    return JSON.parse(JSON.stringify(state.slides || []));
  }

  // ========== SLIDE MANIPULATION COMMANDS ==========

  async newSlide(params) {
    try {
      const state = this.store.getState();
      const slides = state.slides || [];
      const timestamp = new Date().getTime().toString();

      const newSlideObj = {
        id: `o-impress-${timestamp}`,
        slide: params.slide || `Slide ${slides.length}`,
        content: params.content || '',
        data: {
          x: params.x ? parseInt(params.x) : (slides.length * 900),
          y: params.y ? parseInt(params.y) : 0,
          z: params.z ? parseInt(params.z) : 0,
          scale: params.scale ? parseInt(params.scale) : 1,
          rotate: params.rotate ? parseInt(params.rotate) : 0,
          rotateX: params.rotateX ? parseInt(params.rotateX) : 0,
          rotateY: params.rotateY ? parseInt(params.rotateY) : 0,
          rotateZ: params.rotateZ ? parseInt(params.rotateZ) : 0
        }
      };

      // Dispatch Redux action to add slide
      if (this.store.dispatch && window.addStepAction) {
        this.store.dispatch(window.addStepAction(newSlideObj));
      }

      return {
        success: true,
        errorCode: 0,
        output: `Created new slide: ${newSlideObj.id}`,
        result: { id: newSlideObj.id, title: newSlideObj.slide }
      };
    } catch (error) {
      return {
        success: false,
        errorCode: 11,
        output: `Failed to create slide: ${error.message}`,
        result: null
      };
    }
  }

  async setSlideTitle(params) {
    try {
      const { text, slideIndex } = params;
      if (!text) {
        return {
          success: false,
          errorCode: 12,
          output: 'text parameter required',
          result: null
        };
      }

      const state = this.store.getState();
      const slides = state.slides || [];
      const index = slideIndex ? parseInt(slideIndex) : 0;

      if (index < 0 || index >= slides.length) {
        return {
          success: false,
          errorCode: 13,
          output: `Invalid slide index: ${index}`,
          result: null
        };
      }

      const targetSlide = slides[index];

      if (this.store.dispatch && window.editStepAction) {
        this.store.dispatch(window.editStepAction(targetSlide, { name: 'slide', value: text }));
      }

      return {
        success: true,
        errorCode: 0,
        output: `Set slide title to: ${text}`,
        result: { index, title: text }
      };
    } catch (error) {
      return {
        success: false,
        errorCode: 14,
        output: `Failed to set slide title: ${error.message}`,
        result: null
      };
    }
  }

  async addText(params) {
    try {
      const { text, x, y, slideIndex } = params;
      if (!text) {
        return {
          success: false,
          errorCode: 21,
          output: 'text parameter required',
          result: null
        };
      }

      const state = this.store.getState();
      const slides = state.slides || [];
      const index = slideIndex ? parseInt(slideIndex) : slides.length - 1;

      if (index < 0 || index >= slides.length) {
        return {
          success: false,
          errorCode: 22,
          output: `Invalid slide index: ${index}`,
          result: null
        };
      }

      const targetSlide = slides[index];
      const currentContent = targetSlide.content || '';
      const newContent = currentContent ? currentContent + '\n' + text : text;

      if (this.store.dispatch && window.editStepAction) {
        this.store.dispatch(window.editStepAction(targetSlide, { name: 'content', value: newContent }));
      }

      return {
        success: true,
        errorCode: 0,
        output: `Added text to slide ${index}`,
        result: { slideIndex: index, text }
      };
    } catch (error) {
      return {
        success: false,
        errorCode: 23,
        output: `Failed to add text: ${error.message}`,
        result: null
      };
    }
  }

  async listSlides(params) {
    try {
      const state = this.store.getState();
      const slides = state.slides || [];

      const slideList = slides.map((slide, idx) => ({
        index: idx,
        id: slide.id,
        title: slide.slide,
        contentLength: (slide.content || '').length,
        position: { x: slide.data?.x || 0, y: slide.data?.y || 0 }
      }));

      return {
        success: true,
        errorCode: 0,
        output: `Found ${slides.length} slides`,
        result: slideList
      };
    } catch (error) {
      return {
        success: false,
        errorCode: 31,
        output: `Failed to list slides: ${error.message}`,
        result: null
      };
    }
  }

  async getCurrentSlide(params) {
    try {
      const state = this.store.getState();
      const slides = state.slides || [];

      // Find active slide
      const activeSlide = slides.find(s => s.active === true) || slides[0];
      const activeIndex = slides.indexOf(activeSlide);

      return {
        success: true,
        errorCode: 0,
        output: `Current slide: ${activeSlide.slide}`,
        result: {
          index: activeIndex,
          id: activeSlide.id,
          title: activeSlide.slide,
          content: activeSlide.content
        }
      };
    } catch (error) {
      return {
        success: false,
        errorCode: 32,
        output: `Failed to get current slide: ${error.message}`,
        result: null
      };
    }
  }

  async gotoSlide(params) {
    try {
      const { number } = params;
      if (number === undefined) {
        return {
          success: false,
          errorCode: 41,
          output: 'number parameter required',
          result: null
        };
      }

      const state = this.store.getState();
      const slides = state.slides || [];
      const slideIndex = parseInt(number);

      if (slideIndex < 0 || slideIndex >= slides.length) {
        return {
          success: false,
          errorCode: 42,
          output: `Invalid slide number: ${slideIndex}`,
          result: null
        };
      }

      const targetSlide = slides[slideIndex];

      if (this.store.dispatch && window.activeStepAction) {
        this.store.dispatch(window.activeStepAction(targetSlide.id));
      }

      return {
        success: true,
        errorCode: 0,
        output: `Went to slide ${slideIndex}: ${targetSlide.slide}`,
        result: { index: slideIndex, title: targetSlide.slide }
      };
    } catch (error) {
      return {
        success: false,
        errorCode: 43,
        output: `Failed to goto slide: ${error.message}`,
        result: null
      };
    }
  }

  async deleteSlide(params) {
    try {
      const { number } = params;
      const state = this.store.getState();
      const slides = state.slides || [];

      // Default to current slide if not specified
      let slideIndex = number !== undefined ? parseInt(number) : 0;

      if (slideIndex === 0) {
        return {
          success: false,
          errorCode: 51,
          output: 'Cannot delete the overview slide (#0)',
          result: null
        };
      }

      if (slideIndex < 0 || slideIndex >= slides.length) {
        return {
          success: false,
          errorCode: 52,
          output: `Invalid slide number: ${slideIndex}`,
          result: null
        };
      }

      if (this.store.dispatch && window.delStepAction) {
        // Note: This assumes the Redux reducer expects the active slide to be deleted
        // We first set the slide as active, then delete it
        const targetSlide = slides[slideIndex];
        this.store.dispatch(window.activeStepAction(targetSlide.id));
        this.store.dispatch(window.delStepAction());
      }

      return {
        success: true,
        errorCode: 0,
        output: `Deleted slide ${slideIndex}`,
        result: { deletedIndex: slideIndex }
      };
    } catch (error) {
      return {
        success: false,
        errorCode: 53,
        output: `Failed to delete slide: ${error.message}`,
        result: null
      };
    }
  }

  async duplicateSlide(params) {
    try {
      const { number } = params;
      if (number === undefined) {
        return {
          success: false,
          errorCode: 61,
          output: 'number parameter required',
          result: null
        };
      }

      const state = this.store.getState();
      const slides = state.slides || [];
      const slideIndex = parseInt(number);

      if (slideIndex < 0 || slideIndex >= slides.length) {
        return {
          success: false,
          errorCode: 62,
          output: `Invalid slide number: ${slideIndex}`,
          result: null
        };
      }

      const sourceSlide = slides[slideIndex];
      const timestamp = new Date().getTime().toString();

      const duplicatedSlide = {
        id: `o-impress-${timestamp}`,
        slide: sourceSlide.slide + ' (copy)',
        content: sourceSlide.content,
        data: { ...sourceSlide.data }
      };

      if (this.store.dispatch && window.addStepAction) {
        this.store.dispatch(window.addStepAction(duplicatedSlide));
      }

      return {
        success: true,
        errorCode: 0,
        output: `Duplicated slide ${slideIndex}`,
        result: { sourceIndex: slideIndex, newId: duplicatedSlide.id }
      };
    } catch (error) {
      return {
        success: false,
        errorCode: 63,
        output: `Failed to duplicate slide: ${error.message}`,
        result: null
      };
    }
  }

  async undo(params) {
    try {
      if (this.historyIndex <= 0) {
        return {
          success: false,
          errorCode: 71,
          output: 'Nothing to undo',
          result: null
        };
      }

      this.historyIndex--;
      const previousState = this.commandHistory[this.historyIndex]?.state;

      if (previousState && this.store.dispatch && window.importSlidesAction) {
        this.store.dispatch(window.importSlidesAction(previousState));
      }

      return {
        success: true,
        errorCode: 0,
        output: `Undo executed`,
        result: { historyIndex: this.historyIndex }
      };
    } catch (error) {
      return {
        success: false,
        errorCode: 72,
        output: `Failed to undo: ${error.message}`,
        result: null
      };
    }
  }

  async redo(params) {
    try {
      if (this.historyIndex >= this.commandHistory.length - 1) {
        return {
          success: false,
          errorCode: 81,
          output: 'Nothing to redo',
          result: null
        };
      }

      this.historyIndex++;
      const nextState = this.commandHistory[this.historyIndex]?.state;

      if (nextState && this.store.dispatch && window.importSlidesAction) {
        this.store.dispatch(window.importSlidesAction(nextState));
      }

      return {
        success: true,
        errorCode: 0,
        output: `Redo executed`,
        result: { historyIndex: this.historyIndex }
      };
    } catch (error) {
      return {
        success: false,
        errorCode: 82,
        output: `Failed to redo: ${error.message}`,
        result: null
      };
    }
  }

  async getSlides(params) {
    try {
      const state = this.store.getState();
      const slides = state.slides || [];
      return {
        success: true,
        errorCode: 0,
        output: `Retrieved ${slides.length} slides`,
        result: slides
      };
    } catch (error) {
      return {
        success: false,
        errorCode: 91,
        output: `Failed to get slides: ${error.message}`,
        result: null
      };
    }
  }

  async getSlideInfo(params) {
    try {
      const { number } = params;
      const state = this.store.getState();
      const slides = state.slides || [];
      const slideIndex = number !== undefined ? parseInt(number) : 0;

      if (slideIndex < 0 || slideIndex >= slides.length) {
        return {
          success: false,
          errorCode: 92,
          output: `Invalid slide number: ${slideIndex}`,
          result: null
        };
      }

      const slide = slides[slideIndex];
      return {
        success: true,
        errorCode: 0,
        output: `Slide ${slideIndex} info`,
        result: {
          index: slideIndex,
          id: slide.id,
          title: slide.slide,
          content: slide.content,
          position: slide.data,
          active: slide.active
        }
      };
    } catch (error) {
      return {
        success: false,
        errorCode: 93,
        output: `Failed to get slide info: ${error.message}`,
        result: null
      };
    }
  }
}

/**
 * Initialize the RexxJS handler for slides
 */
function initializeSlidesRexxHandler(store) {
  const handler = new SlidesRexxHandler(store);

  window.ADDRESS_SLIDES_HANDLER = async function(command, params = {}) {
    let commandStr = command;

    // Support both string commands and parsed object format
    if (typeof command === 'string') {
      // Parse if it's a string
      commandStr = command;
    } else if (typeof command === 'object' && command.type === 'object') {
      // It's a parsed command object
      commandStr = command.type;
      Object.assign(params, command);
    }

    const result = await handler.run(commandStr);

    // Set RexxJS variables
    if (typeof window.RC !== 'undefined') {
      window.RC = result.errorCode;
    }
    if (typeof window.RESULT !== 'undefined') {
      window.RESULT = result.result || result.output;
    }

    return result;
  };

  console.log('Slides RexxJS handler initialized');
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SlidesRexxHandler, initializeSlidesRexxHandler };
}
