import onHasCompletion from '../utility/onHasCompletion';
/**
 * VariableEditor
 *
 * An instance of CodeMirror for editing variables defined in QueryEditor.
 *
 * Props:
 *
 *   - variableToType: A mapping of variable name to GraphQLType.
 *   - value: The text of the editor.
 *   - onEdit: A function called when the editor changes, given the edited text.
 *   - readOnly: Turns the editor to read-only mode.
 *
 */

export const VariableEditor = {
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

    require('codemirror/addon/edit/matchbrackets');

    require('codemirror/addon/edit/closebrackets');

    require('codemirror/addon/fold/brace-fold');

    require('codemirror/addon/fold/foldgutter');

    require('codemirror/addon/lint/lint');

    require('codemirror/addon/search/searchcursor');

    require('codemirror/addon/search/jump-to-line');

    require('codemirror/addon/dialog/dialog');

    require('codemirror/keymap/sublime');

    require('codemirror-graphql/variables/hint');

    require('codemirror-graphql/variables/lint');

    require('codemirror-graphql/variables/mode');

    this.editor = CodeMirror(this._node, {
      value: this.$attrs.value || '',
      lineNumbers: true,
      tabSize: 2,
      mode: 'graphql-variables',
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
        variableToType: this.$attrs.variableToType
      },
      hintOptions: {
        variableToType: this.$attrs.variableToType,
        closeOnUnfocus: false,
        completeSingle: false
      },
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
      extraKeys: {
        'Cmd-Space': () => this.editor.showHint({
          completeSingle: false
        }),
        'Ctrl-Space': () => this.editor.showHint({
          completeSingle: false
        }),
        'Alt-Space': () => this.editor.showHint({
          completeSingle: false
        }),
        'Shift-Space': () => this.editor.showHint({
          completeSingle: false
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
  },

  beforeDestroy() {
    this.editor.off('change', this._onEdit);
    this.editor.off('keyup', this._onKeyUp);
    this.editor.off('hasCompletion', this._onHasCompletion);
    this.editor = null;
  },

  render() {
    return <div class="codemirrorWrap" ref={node => {
      this._node = node;
    }} />;
  },

  methods: {
    componentDidUpdate(prevProps) {
      const CodeMirror = require('codemirror'); // Ensure the changes caused by this update are not interpretted as
      // user-input changes which could otherwise result in an infinite
      // event loop.


      this.ignoreChangeEvent = true;

      if (this.$attrs.variableToType !== prevProps.variableToType) {
        this.editor.options.lint.variableToType = this.$attrs.variableToType;
        this.editor.options.hintOptions.variableToType = this.$attrs.variableToType;
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
      const code = event.keyCode;

      if (code >= 65 && code <= 90 || // letters
      !event.shiftKey && code >= 48 && code <= 57 || // numbers
      event.shiftKey && code === 189 || // underscore
      event.shiftKey && code === 222 // "
      ) {
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
    }

  }
};