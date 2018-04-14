import { GraphQLSchema, isType } from 'graphql';
import FieldDoc from './DocExplorer/FieldDoc';
import SchemaDoc from './DocExplorer/SchemaDoc';
import SearchBox from './DocExplorer/SearchBox';
import SearchResults from './DocExplorer/SearchResults';
import TypeDoc from './DocExplorer/TypeDoc';
const initialNav = {
  name: 'Schema',
  title: 'Documentation Explorer'
};
/**
 * DocExplorer
 *
 * Shows documentations for GraphQL definitions from the schema.
 *
 * Props:
 *
 *   - schema: A required GraphQLSchema instance that provides GraphQL document
 *     definitions.
 *
 * Children:
 *
 *   - Any provided children will be positioned in the right-hand-side of the
 *     top bar. Typically this will be a "close" button for temporary explorer.
 *
 */

export const DocExplorer = {
  data() {
    this.__state = {
      navStack: [initialNav]
    };
    return this.__state;
  },

  render() {
    const schema = this.$attrs.schema;
    const navStack = this.$data.navStack;
    const navItem = navStack[navStack.length - 1];
    let content;

    if (schema === undefined) {
      // Schema is undefined when it is being loaded via introspection.
      content = <div class="spinner-container">
        <div class="spinner" />
      </div>;
    } else if (!schema) {
      // Schema is null when it explicitly does not exist, typically due to
      // an error during introspection.
      content = <div class="error-container">
        {'No Schema Available'}
      </div>;
    } else if (navItem.search) {
      content = <SearchResults searchValue={navItem.search} withinType={navItem.def} schema={schema} onClickType={this.handleClickTypeOrField} onClickField={this.handleClickTypeOrField} />;
    } else if (navStack.length === 1) {
      content = <SchemaDoc schema={schema} onClickType={this.handleClickTypeOrField} />;
    } else if (isType(navItem.def)) {
      content = <TypeDoc schema={schema} type={navItem.def} onClickType={this.handleClickTypeOrField} onClickField={this.handleClickTypeOrField} />;
    } else {
      content = <FieldDoc field={navItem.def} onClickType={this.handleClickTypeOrField} />;
    }

    const shouldSearchBoxAppear = navStack.length === 1 || isType(navItem.def) && navItem.def.getFields;
    let prevName;

    if (navStack.length > 1) {
      prevName = navStack[navStack.length - 2].name;
    }

    return <div class="doc-explorer" key={navItem.name}>
      <div class="doc-explorer-title-bar">
        {prevName && <div class="doc-explorer-back" onClick={this.handleNavBackClick}>
          {prevName}
        </div>}
        <div class="doc-explorer-title">
          {navItem.title || navItem.name}
        </div>
        <div class="doc-explorer-rhs">
          {this.$children}
        </div>
      </div>
      <div class="doc-explorer-contents">
        {shouldSearchBoxAppear && <SearchBox value={navItem.search} placeholder={`Search ${navItem.name}...`} onSearch={this.handleSearch} />}
        {content}
      </div>
    </div>;
  },

  methods: {
    shouldComponentUpdate(nextProps, nextState) {
      return this.$attrs.schema !== nextProps.schema || this.$data.navStack !== nextState.navStack;
    },

    showDoc(typeOrField) {
      const navStack = this.$data.navStack;
      const topNav = navStack[navStack.length - 1];

      if (topNav.def !== typeOrField) {
        this.navStack = navStack.concat([{
          name: typeOrField.name,
          def: typeOrField
        }]);
      }
    },

    showDocForReference(reference) {
      if (reference.kind === 'Type') {
        this.showDoc(reference.type);
      } else if (reference.kind === 'Field') {
        this.showDoc(reference.field);
      } else if (reference.kind === 'Argument' && reference.field) {
        this.showDoc(reference.field);
      } else if (reference.kind === 'EnumValue' && reference.type) {
        this.showDoc(reference.type);
      }
    },

    showSearch(search) {
      const navStack = this.$data.navStack.slice();
      const topNav = navStack[navStack.length - 1];
      navStack[navStack.length - 1] = {
        ...topNav,
        search
      };
      this.navStack = navStack;
    },

    reset() {
      this.navStack = [initialNav];
    },

    handleNavBackClick() {
      if (this.$data.navStack.length > 1) {
        this.navStack = this.$data.navStack.slice(0, -1);
      }
    },

    handleClickTypeOrField(typeOrField) {
      this.showDoc(typeOrField);
    },

    handleSearch(value) {
      this.showSearch(value);
    }

  }
};
