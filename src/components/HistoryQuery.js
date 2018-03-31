export default {
  data() {
    var props = this.$props;
    const starVisibility = this.$attrs.favorite ? 'visible' : 'hidden';
    this.__state = {
      starVisibility
    };
    return this.__state;
  },

  render() {
    if (this.$attrs.favorite && this.$data.starVisibility === 'hidden') {
      this.starVisibility = 'visible';
    }

    const starStyles = {
      float: 'right',
      visibility: this.$data.starVisibility
    };
    const displayName = this.$attrs.operationName || this.$attrs.query.split('\n').filter(line => line.indexOf('#') !== 0).join('');
    const starIcon = this.$attrs.favorite ? '\u2605' : '\u2606';
    return <p onClick={this.handleClick.bind(this)} onMouseEnter={this.handleMouseEnter.bind(this)} onMouseLeave={this.handleMouseLeave.bind(this)}>
        <span>
          {displayName}
        </span>
        <span onClick={this.handleStarClick.bind(this)} style={starStyles}>
          {starIcon}
        </span>
      </p>;
  },

  methods: {
    handleMouseEnter() {
      if (!this.$attrs.favorite) {
        this.starVisibility = 'visible';
      }
    },

    handleMouseLeave() {
      if (!this.$attrs.favorite) {
        this.starVisibility = 'hidden';
      }
    },

    handleClick() {
      this.$emit("select", this.$attrs.query, this.$attrs.variables, this.$attrs.operationName);
    },

    handleStarClick(e) {
      e.stopPropagation();
      this.$attrs.handleToggleFavorite(this.$attrs.query, this.$attrs.variables, this.$attrs.operationName, this.$attrs.favorite);
    }

  }
};