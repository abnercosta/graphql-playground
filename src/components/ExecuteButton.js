/**
 * ExecuteButton
 *
 * What a nice round shiny button. Shows a drop-down when there are multiple
 * queries to run.
 */
export const ExecuteButton = {
  data() {
    var props = this.$props;
    this.__state = {
      optionsOpen: false,
      highlight: null
    };
    return this.__state;
  },

  render() {
    const operations = this.$attrs.operations;
    const optionsOpen = this.$data.optionsOpen;
    const hasOptions = operations && operations.length > 1;
    let options = null;

    if (hasOptions && optionsOpen) {
      const highlight = this.$data.highlight;
      options = <ul class="execute-options">
          {operations.map(operation => <li key={operation.name ? operation.name.value : '*'} class={operation === highlight && 'selected' || null} onMouseOver={() => {
          this.highlight = operation;
        }} onMouseOut={() => {
          this.highlight = null;
        }} onMouseUp={() => this._onOptionSelected(operation)}>
              {operation.name ? operation.name.value : '<Unnamed>'}
            </li>)}
        </ul>;
    } // Allow click event if there is a running query or if there are not options
    // for which operation to run.


    let onClick;

    if (this.$attrs.isRunning || !hasOptions) {
      onClick = this._onClick;
    } // Allow mouse down if there is no running query, there are options for
    // which operation to run, and the dropdown is currently closed.


    let onMouseDown;

    if (!this.$attrs.isRunning && hasOptions && !optionsOpen) {
      onMouseDown = this._onOptionsOpen;
    }

    const pathJSX = this.$attrs.isRunning ? <path d="M 10 10 L 23 10 L 23 23 L 10 23 z" /> : <path d="M 11 9 L 24 16 L 11 23 z" />;
    return <div class="execute-button-wrap">
        <button type="button" class="execute-button" onMouseDown={onMouseDown} onClick={onClick} title="Execute Query (Ctrl-Enter)">
          <svg width="34" height="34">{pathJSX}</svg>
        </button>
        {options}
      </div>;
  },

  methods: {
    _onClick() {
      if (this.$attrs.isRunning) {
        this.$emit("stop");
      } else {
        this.$emit("run");
      }
    },

    _onOptionSelected(operation) {
      this.optionsOpen = false;
      this.$emit("run", operation.name && operation.name.value);
    },

    _onOptionsOpen(downEvent) {
      let initialPress = true;
      const downTarget = downEvent.target;
      this.highlight = null, this.optionsOpen = true;

      let onMouseUp = upEvent => {
        if (initialPress && upEvent.target === downTarget) {
          initialPress = false;
        } else {
          document.removeEventListener('mouseup', onMouseUp);
          onMouseUp = null;
          const isOptionsMenuClicked = downTarget.parentNode.compareDocumentPosition(upEvent.target) & Node.DOCUMENT_POSITION_CONTAINED_BY;

          if (!isOptionsMenuClicked) {
            // menu calls setState if it was clicked
            this.optionsOpen = false;
          }
        }
      };

      document.addEventListener('mouseup', onMouseUp);
    }

  }
};