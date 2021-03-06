/**
 * ToolbarSelect
 *
 * A select-option style button to use within the Toolbar.
 *
 */
export const ToolbarSelect = {
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
    let selectedChild;
    const visible = this.$data.visible;
    const optionChildren = React.Children.map(this.$children, (child, i) => {
      if (!selectedChild || child.props.selected) {
        selectedChild = child;
      }

      const onChildSelect = child.props.onSelect || this.$attrs.onSelect && this.$attrs.onSelect.bind(null, child.props.value, i);
      return <ToolbarSelectOption {...child.props} onSelect={onChildSelect} />;
    });
    return <a class="toolbar-select toolbar-button" onClick={this.handleOpen.bind(this)} onMouseDown={preventDefault} ref={node => {
      this._node = node;
    }} title={this.$attrs.title}>
        {selectedChild.props.label}
        <svg width="13" height="10">
          <path fill="#666" d="M 5 5 L 13 5 L 9 1 z" />
          <path fill="#666" d="M 5 6 L 13 6 L 9 10 z" />
        </svg>
        <ul class={'toolbar-select-options' + (visible ? ' open' : '')}>
          {optionChildren}
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
export function ToolbarSelectOption({
  onSelect,
  label,
  selected
}) {
  return <li onMouseOver={e => {
    e.target.className = 'hover';
  }} onMouseOut={e => {
    e.target.className = null;
  }} onMouseDown={preventDefault} onMouseUp={onSelect}>
      {label}
      {selected && <svg width="13" height="13">
          <polygon points="4.851,10.462 0,5.611 2.314,3.297 4.851,5.835
            10.686,0 13,2.314 4.851,10.462" />
        </svg>}
    </li>;
}
ToolbarSelectOption.propTypes = {
  onSelect: PropTypes.func,
  selected: PropTypes.bool,
  label: PropTypes.string,
  value: PropTypes.any
};

function preventDefault(e) {
  e.preventDefault();
}