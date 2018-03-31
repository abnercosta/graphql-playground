import MD from 'markdown-it';
const md = new MD();
export default {
  render() {
    const markdown = this.$attrs.markdown;

    if (!markdown) {
      return <div />;
    }

    return <div class={this.$attrs.className} dangerouslySetInnerHTML={{
      __html: md.render(markdown)
    }} />;
  },

  methods: {
    shouldComponentUpdate(nextProps) {
      return this.$attrs.markdown !== nextProps.markdown;
    }

  }
};