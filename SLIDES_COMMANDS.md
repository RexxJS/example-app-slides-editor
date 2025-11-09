# Slides Editor RexxJS Commands Reference

## Overview

Slides Editor now supports RexxJS scripting via the `ADDRESS SLIDES` command interface. This allows you to script slide creation, manipulation, navigation, and content management programmatically.

## Quick Start

### In-App Execution

```rexx
/* Create slides programmatically */
ADDRESS SLIDES "new-slide"
ADDRESS SLIDES "set-slide-title text=Welcome"
ADDRESS SLIDES "add-text text=This is my presentation"

/* Check current slide */
ADDRESS SLIDES "get-current-slide"
SAY "Current: " RESULT

/* Navigate between slides */
ADDRESS SLIDES "goto-slide number=1"
ADDRESS SLIDES "list-slides"
SAY "Total slides: " RESULT
```

### Iframe Control Bus

```rexx
/* Execute from separate director frame */
ADDRESS SLIDES "new-slide"
SAY "Slide created"

ADDRESS SLIDES "list-slides"
SAY "All slides: " RESULT
```

## Command Reference

### Slide Creation Commands

#### new-slide
Create a new slide in the presentation.

```rexx
ADDRESS SLIDES "new-slide"
```

**Parameters:**
- `slide` (string, optional) - Slide title (default: auto-generated)
- `content` (string, optional) - Initial content
- `x` (number, optional) - X position (default: calculated)
- `y` (number, optional) - Y position (default: 0)
- `z` (number, optional) - Z position (default: 0)
- `scale` (number, optional) - Scale factor (default: 1)
- `rotate` (number, optional) - Rotation in degrees (default: 0)

**Returns:** Success status with new slide ID
**Error Codes:** 11-14
**Example:** `ADDRESS SLIDES "new-slide"`

---

#### duplicate-slide
Create a copy of an existing slide.

```rexx
ADDRESS SLIDES "duplicate-slide number=0"
```

**Parameters:**
- `number` (number, required) - Index of slide to duplicate

**Returns:** Success status with new slide ID
**Error Codes:** 61-63
**Example:** `ADDRESS SLIDES "duplicate-slide number=2"`

---

### Slide Content Commands

#### set-slide-title
Set or update a slide's title.

```rexx
ADDRESS SLIDES "set-slide-title text=New Title"
```

**Parameters:**
- `text` (string, required) - New slide title
- `slideIndex` (number, optional) - Target slide index (default: current)

**Returns:** Success status
**Error Codes:** 12-14
**Example:** `ADDRESS SLIDES "set-slide-title text=Chapter 1"`

---

#### add-text
Add text content to a slide.

```rexx
ADDRESS SLIDES "add-text text=Hello World"
```

**Parameters:**
- `text` (string, required) - Text content to add
- `slideIndex` (number, optional) - Target slide index (default: last)
- `x` (number, optional) - X position
- `y` (number, optional) - Y position

**Returns:** Success status
**Error Codes:** 21-23
**Example:** `ADDRESS SLIDES "add-text text=Bullet point 1"`

---

### Slide Navigation Commands

#### goto-slide
Navigate to a specific slide.

```rexx
ADDRESS SLIDES "goto-slide number=2"
```

**Parameters:**
- `number` (number, required) - Slide index (0 = overview)

**Returns:** Success status with slide title
**Error Codes:** 41-43
**Example:** `ADDRESS SLIDES "goto-slide number=3"`

---

#### get-current-slide
Get information about the currently active slide.

```rexx
ADDRESS SLIDES "get-current-slide"
SAY "Current: " RESULT
```

**Returns:** Slide information object
**Result Format:**
```json
{
  "index": 0,
  "id": "o-impress-abc123",
  "title": "Slide Title",
  "content": "Slide content text"
}
```
**Error Codes:** 32
**Example:** See above

---

#### list-slides
List all slides in the presentation.

```rexx
ADDRESS SLIDES "list-slides"
SAY "Slides: " RESULT
```

**Returns:** Array of slide summaries
**Result Format:**
```json
[
  {
    "index": 0,
    "id": "o-impress-abc123",
    "title": "Overview",
    "contentLength": 0,
    "position": {"x": 0, "y": 0}
  },
  ...
]
```
**Error Codes:** 31
**Example:** See above

---

### Slide Modification Commands

#### delete-slide
Remove a slide from the presentation.

```rexx
ADDRESS SLIDES "delete-slide number=1"
```

**Parameters:**
- `number` (number, optional) - Index of slide to delete (default: current)

**Returns:** Success status
**Error Codes:** 51-53
**Note:** Cannot delete slide #0 (overview)
**Example:** `ADDRESS SLIDES "delete-slide number=2"`

---

### Slide Query Commands

#### get-slide-info
Get detailed information about a specific slide.

```rexx
ADDRESS SLIDES "get-slide-info number=1"
SAY RESULT
```

**Parameters:**
- `number` (number, required) - Slide index

**Returns:** Detailed slide information object
**Result Format:**
```json
{
  "index": 1,
  "id": "o-impress-def456",
  "title": "Slide 1",
  "content": "Detailed content",
  "position": {
    "x": 900,
    "y": 0,
    "z": 0,
    "scale": 1,
    "rotate": 0,
    "rotateX": 0,
    "rotateY": 0,
    "rotateZ": 0
  },
  "active": true
}
```
**Error Codes:** 92-93
**Example:** `ADDRESS SLIDES "get-slide-info number=0"`

---

#### get-slides
Get all slides in the presentation (raw Redux state).

```rexx
ADDRESS SLIDES "get-slides"
SAY "Full state: " RESULT
```

**Returns:** Complete slides array
**Error Codes:** 91
**Example:** See above

---

### History Commands

#### undo
Undo the last slide modification.

```rexx
ADDRESS SLIDES "undo"
```

**Returns:** Success status
**Error Codes:** 71-72
**Example:** See above

---

#### redo
Redo the last undone modification.

```rexx
ADDRESS SLIDES "redo"
```

**Returns:** Success status
**Error Codes:** 81-82
**Example:** See above

---

## Error Handling

Every command sets the `RC` variable to indicate success or failure:

```rexx
ADDRESS SLIDES "new-slide"
IF RC = 0 THEN
    SAY "Slide created successfully"
ELSE
    SAY "Error: RC=" RC
```

### Common Error Codes

- **0** - Success
- **1** - Slides handler not initialized
- **2** - Unknown command
- **11-14** - new-slide command errors
- **12-14** - set-slide-title command errors
- **21-23** - add-text command errors
- **31** - list-slides command errors
- **32** - get-current-slide command errors
- **41-43** - goto-slide command errors
- **51-53** - delete-slide command errors
- **61-63** - duplicate-slide command errors
- **71-72** - undo command errors
- **81-82** - redo command errors
- **91-93** - Query command errors
- **99** - Unexpected error

The `RESULT` variable contains additional information about the operation.

## Example Scripts

### Example 1: Create a Multi-Slide Presentation

```rexx
/* Create title slide */
ADDRESS SLIDES "new-slide"
ADDRESS SLIDES "set-slide-title text=My Presentation"
ADDRESS SLIDES "add-text text=Presented by John Doe"
SAY "Title slide created"

/* Create content slide */
ADDRESS SLIDES "new-slide"
ADDRESS SLIDES "set-slide-title text=Contents"
ADDRESS SLIDES "add-text text=1. Introduction"
ADDRESS SLIDES "add-text text=2. Main Points"
ADDRESS SLIDES "add-text text=3. Conclusion"
SAY "Contents slide created"

/* Create closing slide */
ADDRESS SLIDES "new-slide"
ADDRESS SLIDES "set-slide-title text=Thank You"
ADDRESS SLIDES "add-text text=Questions?"
SAY "Closing slide created"

/* Verify presentation */
ADDRESS SLIDES "list-slides"
SAY "Presentation complete with slides: " RESULT
```

### Example 2: Navigate and Inspect Slides

```rexx
/* Get all slides */
ADDRESS SLIDES "list-slides"
SAY "All slides:"
SAY RESULT

/* Inspect each slide */
DO i = 0 TO 2
    ADDRESS SLIDES "goto-slide number=" i
    ADDRESS SLIDES "get-slide-info number=" i
    SAY "Slide " i ": " RESULT
END
```

### Example 3: Duplicate and Modify Slides

```rexx
/* Navigate to first content slide */
ADDRESS SLIDES "goto-slide number=1"
SAY "At slide 1"

/* Duplicate it */
ADDRESS SLIDES "duplicate-slide number=1"
SAY "Duplicated slide"

/* Modify the copy */
ADDRESS SLIDES "goto-slide number=2"
ADDRESS SLIDES "set-slide-title text=Contents (Continued)"
ADDRESS SLIDES "add-text text=4. Q&A"
SAY "Modified duplicate"

/* Verify changes */
ADDRESS SLIDES "list-slides"
SAY "Updated presentation"
```

### Example 4: Undo/Redo Operations

```rexx
/* Create slides */
ADDRESS SLIDES "new-slide"
ADDRESS SLIDES "set-slide-title text=First"
SAY "Created first"

ADDRESS SLIDES "new-slide"
ADDRESS SLIDES "set-slide-title text=Second"
SAY "Created second"

/* List current state */
ADDRESS SLIDES "list-slides"
SAY "Current: " RESULT

/* Undo last slide */
ADDRESS SLIDES "undo"
SAY "Undone"

/* List after undo */
ADDRESS SLIDES "list-slides"
SAY "After undo: " RESULT

/* Redo */
ADDRESS SLIDES "redo"
SAY "Redone"

/* Final state */
ADDRESS SLIDES "list-slides"
SAY "After redo: " RESULT
```

### Example 5: Generate Presentation from Data

```rexx
/* Create title */
ADDRESS SLIDES "new-slide"
ADDRESS SLIDES "set-slide-title text=Product Launch"
ADDRESS SLIDES "add-text text=2024 Product Roadmap"

/* Create feature slides */
DO i = 1 TO 3
    ADDRESS SLIDES "new-slide"
    ADDRESS SLIDES "set-slide-title text=Feature " i
    ADDRESS SLIDES "add-text text=Feature number " i " description"
    SAY "Added feature slide " i
END

/* Create conclusion */
ADDRESS SLIDES "new-slide"
ADDRESS SLIDES "set-slide-title text=Thank You"
ADDRESS SLIDES "add-text text=Questions?"

/* Final summary */
ADDRESS SLIDES "list-slides"
SAY "Presentation ready with " RESULT " slides"
```

## Integration Modes

### Mode 1: In-App Execution

Scripts run within the Slides Editor application context. Use `ADDRESS SLIDES` directly.

**Best for:**
- Tauri desktop app
- Single-frame deployments
- Direct presentation manipulation
- Automated slide generation

### Mode 2: Iframe Control Bus

Scripts run in a separate director frame and communicate with Slides worker frame via postMessage RPC.

**Best for:**
- Multi-frame deployments
- Sandboxed script execution
- Distributed architectures
- Web-based deployments

See `slides-controlbus-demo.html` for an example implementation.

## Performance Considerations

- **Slide creation**: 50-100ms per slide (Redux state update + impress.js initialization)
- **List operations**: <10ms (state query)
- **Navigation**: <5ms (Redux state update)
- **Undo/Redo**: Varies by presentation size
- **Large presentations**: 100+ slides may show slight lag in navigation

## Security Notes

- All inputs are validated before slide creation
- No arbitrary code execution is possible through commands
- Slide titles and content are sanitized
- Commands execute in app context with full access to presentation state
- File paths are restricted when applicable

## Debugging

Enable logging to see command execution details:

```javascript
// In browser console
window.DEBUG_SLIDES = true;

// Then run script - detailed logs will appear
ADDRESS SLIDES "new-slide"
```

## Comparison with UI Operations

Commands provide programmatic equivalents to manual operations:

| Operation | Manual UI | RexxJS Command |
|-----------|-----------|-----------------|
| Create slide | Click "New Slide" | `ADDRESS SLIDES "new-slide"` |
| Set title | Edit in UI | `ADDRESS SLIDES "set-slide-title text=..."` |
| Add content | Type in editor | `ADDRESS SLIDES "add-text text=..."` |
| Navigate | Click in UI | `ADDRESS SLIDES "goto-slide number=..."` |
| Delete | Right-click delete | `ADDRESS SLIDES "delete-slide number=..."` |
| List all | View sidebar | `ADDRESS SLIDES "list-slides"` |
| Undo | Ctrl+Z | `ADDRESS SLIDES "undo"` |

## Changelog

### Version 1.0
- Initial release with 12+ slide manipulation commands
- In-app execution support
- Iframe control bus demo
- Full slide CRUD operations
- Undo/redo functionality
- Error handling with RC/RESULT variables
- Full Redux state integration

## API Design Philosophy

The RexxJS command interface follows these principles:

1. **Simplicity**: Single command string format with optional parameters
2. **Consistency**: All commands return {success, errorCode, output, result}
3. **Flexibility**: Works in both in-app and iframe control bus modes
4. **Safety**: No arbitrary code execution, only validated operations
5. **Completeness**: Commands cover all major presentation operations
