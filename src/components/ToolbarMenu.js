/**
 * ToolbarMenu
 *
 * A menu style button to use within the Toolbar.
 */
export const ToolbarMenu = {
  data() {
    var props = this.$props;
    this.__state = {
      visible: false
    };
    return this.__state;
  },

  beforeDestroy() {
    this._release();
  },

  render() {
    const visible = this.$data.visible;
    return <a class="toolbar-menu toolbar-button" onClick={this.handleOpen.bind(this)} onMouseDown={preventDefault} ref={node => {
      this._node = node;
    }} title={this.$attrs.title}>
        {this.$attrs.label}
        <svg width="14" height="8">
          <path fill="#666" d="M 5 1.5 L 14 1.5 L 9.5 7 z" />
        </svg>
        <ul class={'toolbar-menu-items' + (visible ? ' open' : '')}>
          {this.$children}
        </ul>
      </a>;
  },

  methods: {
    _subscribe() {
      if (!this._listener) {
        this._listener = this.handleClick.bind(this);
        document.addEventListener('click', this._listener);
      }
    },

    _release() {
      if (this._listener) {
        document.removeEventListener('click', this._listener);
        this._listener = null;
      }
    },

    handleClick(e) {
      if (this._node !== e.target) {
        preventDefault(e);
        this.visible = false;

        this._release();
      }
    },

    handleOpen(e) {
      preventDefault(e);
      this.visible = true;

      this._subscribe();
    }

  }
};
export function ToolbarMenuItem({
  onSelect,
  title,
  label
}) {
  return <li onMouseOver={e => {
    e.target.className = 'hover';
  }} onMouseOut={e => {
    e.target.className = null;
  }} onMouseDown={preventDefault} onMouseUp={onSelect} title={title}>
      {label}
    </li>;
}
ToolbarMenuItem.propTypes = {
  onSelect: PropTypes.func,
  title: PropTypes.string,
  label: PropTypes.string
};

function preventDefault(e) {
  e.preventDefault();
}