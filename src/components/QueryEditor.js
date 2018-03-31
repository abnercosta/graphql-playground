import { GraphQLSchema } from 'graphql';
import MD from 'markdown-it';
import { normalizeWhitespace } from '../utility/normalizeWhitespace';
import onHasCompletion from '../utility/onHasCompletion';
const md = new MD();
const AUTO_COMPLETE_AFTER_KEY = /^[a-zA-Z0-9_@(]$/;
/**
 * QueryEditor
 *
 * Maintains an instance of CodeMirror responsible for editing a GraphQL query.
 *
 * Props:
 *
 *   - schema: A GraphQLSchema instance enabling editor linting and hinting.
 *   - value: The text of the editor.
 *   - onEdit: A function called when the editor changes, given the edited text.
 *   - readOnly: Turns the editor to read-only mode.
 *
 */

export const QueryEditor = {
  data() {
    var props = this.$props;
    // Keep a cached version of the value, this cache will be updated when the
    // editor is updated, which can later be used to protect the editor from
    // unnecessary updates during the update lifecycle.
    this.cachedValue = props.value || '';
    return this.__state;
  },

  mounted() {
    // Lazily require to ensure requiring GraphiQL outside of a Browser context
    // does not produce an error.
    const CodeMirror = require('codemirror');

    require('codemirror/addon/hint/show-hint');

    require('codemirror/addon/comment/comment');

    require('codemirror/addon/edit/matchbrackets');

    require('codemirror/addon/edit/closebrackets');

    require('codemirror/addon/fold/foldgutter');

    require('codemirror/addon/fold/brace-fold');

    require('codemirror/addon/search/search');

    require('codemirror/addon/search/searchcursor');

    require('codemirror/addon/search/jump-to-line');

    require('codemirror/addon/dialog/dialog');

    require('codemirror/addon/lint/lint');

    require('codemirror/keymap/sublime');

    require('codemirror-graphql/hint');

    require('codemirror-graphql/lint');

    require('codemirror-graphql/info');

    require('codemirror-graphql/jump');

    require('codemirror-graphql/mode');

    this.editor = CodeMirror(this._node, {
      value: this.$attrs.value || '',
      lineNumbers: true,
      tabSize: 2,
      mode: 'graphql',
      theme: this.$attrs.editorTheme || 'graphiql',
      keyMap: 'sublime',
      autoCloseBrackets: true,
      matchBrackets: true,
      showCursorWhenSelecting: true,
      readOnly: this.$attrs.readOnly ? 'nocursor' : false,
      foldGutter: {
        minFoldSize: 4
      },
      lint: {
        schema: this.$attrs.schema
      },
      hintOptions: {
        schema: this.$attrs.schema,
        closeOnUnfocus: false,
        completeSingle: false
      },
      info: {
        schema: this.$attrs.schema,
        renderDescription: text => md.render(text),
        onClick: reference => this.$emit("clickReference", reference)
      },
      jump: {
        schema: this.$attrs.schema,
        onClick: reference => this.$emit("clickReference", reference)
      },
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      extraKeys: {
        'Cmd-Space': () => this.editor.showHint({
          completeSingle: true
        }),
        'Ctrl-Space': () => this.editor.showHint({
          completeSingle: true
        }),
        'Alt-Space': () => this.editor.showHint({
          completeSingle: true
        }),
        'Shift-Space': () => this.editor.showHint({
          completeSingle: true
        }),
        'Cmd-Enter': () => {
          if (this.$attrs.onRunQuery) {
            this.$emit("runQuery");
          }
        },
        'Ctrl-Enter': () => {
          if (this.$attrs.onRunQuery) {
            this.$emit("runQuery");
          }
        },
        'Shift-Ctrl-P': () => {
          if (this.$attrs.onPrettifyQuery) {
            this.$emit("prettifyQuery");
          }
        },
        // Persistent search box in Query Editor
        'Cmd-F': 'findPersistent',
        'Ctrl-F': 'findPersistent',
        // Editor improvements
        'Ctrl-Left': 'goSubwordLeft',
        'Ctrl-Right': 'goSubwordRight',
        'Alt-Left': 'goGroupLeft',
        'Alt-Right': 'goGroupRight'
      }
    });
    this.editor.on('change', this._onEdit);
    this.editor.on('keyup', this._onKeyUp);
    this.editor.on('hasCompletion', this._onHasCompletion);
    this.editor.on('beforeChange', this._onBeforeChange);
  },

  beforeDestroy() {
    this.editor.off('change', this._onEdit);
    this.editor.off('keyup', this._onKeyUp);
    this.editor.off('hasCompletion', this._onHasCompletion);
    this.editor = null;
  },

  render() {
    return <div class="query-editor" ref={node => {
      this._node = node;
    }} />;
  },

  methods: {
    componentDidUpdate(prevProps) {
      const CodeMirror = require('codemirror'); // Ensure the changes caused by this update are not interpretted as
      // user-input changes which could otherwise result in an infinite
      // event loop.


      this.ignoreChangeEvent = true;

      if (this.$attrs.schema !== prevProps.schema) {
        this.editor.options.lint.schema = this.$attrs.schema;
        this.editor.options.hintOptions.schema = this.$attrs.schema;
        this.editor.options.info.schema = this.$attrs.schema;
        this.editor.options.jump.schema = this.$attrs.schema;
        CodeMirror.signal(this.editor, 'change', this.editor);
      }

      if (this.$attrs.value !== prevProps.value && this.$attrs.value !== this.cachedValue) {
        this.cachedValue = this.$attrs.value;
        this.editor.setValue(this.$attrs.value);
      }

      this.ignoreChangeEvent = false;
    },

    getCodeMirror() {
      return this.editor;
    },

    getClientHeight() {
      return this._node && this._node.clientHeight;
    },

    _onKeyUp(cm, event) {
      if (AUTO_COMPLETE_AFTER_KEY.test(event.key)) {
        this.editor.execCommand('autocomplete');
      }
    },

    _onEdit() {
      if (!this.ignoreChangeEvent) {
        this.cachedValue = this.editor.getValue();

        if (this.$attrs.onEdit) {
          this.$emit("edit", this.cachedValue);
        }
      }
    },

    _onHasCompletion(cm, data) {
      onHasCompletion(cm, data, this.$attrs.onHintInformationRender);
    },

    _onBeforeChange(instance, change) {
      // The update function is only present on non-redo, non-undo events.
      if (change.origin === 'paste') {
        const text = change.text.map(normalizeWhitespace);
        change.update(change.from, change.to, text);
      }
    }

  }
};