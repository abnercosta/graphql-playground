import Argument from './Argument';
import MarkdownContent from './MarkdownContent';
import TypeLink from './TypeLink';
export default {
  render() {
    const field = this.$attrs.field;
    let argsDef;

    if (field.args && field.args.length > 0) {
      argsDef = <div class="doc-category">
          <div class="doc-category-title">
            {'arguments'}
          </div>
          {field.args.map(arg => <div key={arg.name} class="doc-category-item">
              <div>
                <Argument arg={arg} onClickType={this.$attrs.onClickType} />
              </div>
              <MarkdownContent class="doc-value-description" markdown={arg.description} />
            </div>)}
        </div>;
    }

    return <div>
        <MarkdownContent class="doc-type-description" markdown={field.description || 'No Description'} />
        {field.deprecationReason && <MarkdownContent class="doc-deprecation" markdown={field.deprecationReason} />}
        <div class="doc-category">
          <div class="doc-category-title">
            {'type'}
          </div>
          <TypeLink type={field.type} onClick={this.$attrs.onClickType} />
        </div>
        {argsDef}
      </div>;
  },

  methods: {
    shouldComponentUpdate(nextProps) {
      return this.$attrs.field !== nextProps.field;
    }

  }
};