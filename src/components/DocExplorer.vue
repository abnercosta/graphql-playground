<template>
  <div class="doc-explorer" :key="navItem.name">
    <div class="doc-explorer-title-bar">
      <div
        v-if="prevName"
        class="doc-explorer-back"
        @click="onHandleNavBackClick">
        {{ prevName }}
      </div>
      <div class="doc-explorer-title">
        {{ navItem.title || navItem.name }}
      </div>
      <div class="doc-explorer-rhs">
        <nuxt-child />
      </div>
    </div>
    <div class="doc-explorer-contents">
        <SearchBox
          v-if="shouldSearchBoxAppear"
          :value="navItem.search"
          :placeholder="`Search ${navItem.name}...`"
          :onSearch="handleSearch"
        />
      {{ content }}
    </div>
  </div>
</template>
<script>
import { GraphQLSchema, isType } from 'graphql'
import FieldDoc from './DocExplorer/FieldDoc'
import SchemaDoc from './DocExplorer/SchemaDoc'
import SearchBox from './DocExplorer/SearchBox'
import SearchResults from './DocExplorer/SearchResults'
import TypeDoc from './DocExplorer/TypeDoc'

const initialNav = {
  name: 'Schema',
  title: 'Documentation Explorer',
}

export default {
  name: 'DocExplorer',
  componentName: 'DocExplorer',
  props: {
    schema: {
      type: Object
    }
  },
  data () {
    return {
      navStack: [initialNav]
    }
  },
  methods: {
    showDoc(typeOrField) {
      const navStack = this.navStack;
      const topNav = navStack[navStack.length - 1];
      if (topNav.def !== typeOrField) {

        this.navStack = navStack.concat([
          {
            name: typeOrField.name,
            def: typeOrField,
          }
        ])
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
    showSearch (search) {
      const navStack = this.navStack.slice()
      const topNav = navStack[navStack.length - 1];
      navStack[navStack.length - 1] = { ...topNav, search };
      this.navStack = navStack
    },
    reset() {
      this.navStack = [initialNav]
    },
    onHandleNavBackClick = () => {
      if (this.navStack.length > 1) {
        this.navStack = this.navStack.slice(0, -1)
      }
    },
    handleClickTypeOrField (typeOrField) {
      this.showDoc(typeOrField)
    },
    handleSearch (value) {
      this.showSearch(value)
    }
  }
}
