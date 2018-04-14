import { GraphQLList, GraphQLNonNull } from 'graphql';
export default {
  render() {
    return renderType(this.$attrs.type, this.$attrs.onClick);
  },

  methods: {
    shouldComponentUpdate(nextProps) {
      return this.$attrs.type !== nextProps.type;
    }

  }
};

function renderType(type, onClick) {
  if (type instanceof GraphQLNonNull) {
    return <span>{renderType(type.ofType, onClick)}{'!'}</span>;
  }

  if (type instanceof GraphQLList) {
    return <span>{'['}{renderType(type.ofType, onClick)}{']'}</span>;
  }

  return <a className="type-name" onClick={event => onClick(type, event)}>
      {type.name}
    </a>;
}