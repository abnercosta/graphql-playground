import TypeLink from './TypeLink';
import MarkdownContent from './MarkdownContent'; // Render the top level Schema

export default {
  render() {
    const schema = this.$attrs.schema;
    const queryType = schema.getQueryType();
    const mutationType = schema.getMutationType && schema.getMutationType();
    const subscriptionType = schema.getSubscriptionType && schema.getSubscriptionType();
    return <div>
        <MarkdownContent class="doc-type-description" markdown={'A GraphQL schema provides a root type for each kind of operation.'} />
        <div class="doc-category">
          <div class="doc-category-title">
            {'root types'}
          </div>
          <div class="doc-category-item">
            <span class="keyword">{'query'}</span>
            {': '}
            <TypeLink type={queryType} onClick={this.$attrs.onClickType} />
          </div>
          {mutationType && <div class="doc-category-item">
              <span class="keyword">{'mutation'}</span>
              {': '}
              <TypeLink type={mutationType} onClick={this.$attrs.onClickType} />
            </div>}
          {subscriptionType && <div class="doc-category-item">
              <span class="keyword">{'subscription'}</span>
              {': '}
              <TypeLink type={subscriptionType} onClick={this.$attrs.onClickType} />
            </div>}
        </div>
      </div>;
  },

  methods: {
    shouldComponentUpdate(nextProps) {
      return this.$attrs.schema !== nextProps.schema;
    }

  }
};