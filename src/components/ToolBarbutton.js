/**
 * ToolbarButton
 *
 * A button to use within the Toolbar.
 */
export const ToolbarButton = {
  data() {
    var props = this.$props;
    this.__state = {
      error: null
    };
    return this.__state;
  },

  render() {
    const {
      error
    } = this.$data;
    return <a class={'toolbar-button' + (error ? ' error' : '')} onMouseDown={preventDefault} onClick={this.handleClick} title={error ? error.message : this.$attrs.title}>
        {this.$attrs.label}
      </a>;
  },

  methods: {
    handleClick(e) {
      e.preventDefault();

      try {
        this.$emit("click");
        this.error = null;
      } catch (error) {
        this.error = error;
      }
    }

  }
};

function preventDefault(e) {
  e.preventDefault();
}