import debounce from '../../utility/debounce';
export default {
  data() {
    var props = this.$props;
    this.__state = {
      value: props.value || ''
    };
    this.debouncedOnSearch = debounce(200, this.$attrs.onSearch);
    return this.__state;
  },

  render() {
    return <label class="search-box">
        <input value={this.$data.value} onChange={this.handleChange} type="text" placeholder={this.$attrs.placeholder} />
        {this.$data.value && <div class="search-box-clear" onClick={this.handleClear}>
            {'\u2715'}
          </div>}
      </label>;
  },

  methods: {
    handleChange(event) {
      const value = event.target.value;
      this.value = value;
      this.debouncedOnSearch(value);
    },

    handleClear() {
      this.value = '';
      this.$emit("search", '');
    }

  }
};