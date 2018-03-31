import Vue from "vue";

/**
 * ResultViewer
 *
 * Maintains an instance of CodeMirror for viewing a GraphQL response.
 *
 * Props:
 *
 *   - value: The text of the editor.
 *
 */
export const ResultViewer = {
  data() {
    return this.__state;
  },

  mounted() {
    // Lazily require to ensure requiring GraphiQL outside of a Browser context
    // does not produce an error.
    const CodeMirror = require('codemirror');

    require('codemirror/addon/fold/foldgutter');

    require('codemirror/addon/fold/brace-fold');

    require('codemirror/addon/dialog/dialog');

    require('codemirror/addon/search/search');

    require('codemirror/addon/search/searchcursor');

    require('codemirror/addon/search/jump-to-line');

    require('codemirror/keymap/sublime');

    require('codemirror-graphql/results/mode');

    if (this.$attrs.ResultsTooltip) {
      require('codemirror-graphql/utils/info-addon');

      const tooltipDiv = document.createElement('div');
      CodeMirror.registerHelper('info', 'graphql-results', (token, options, cm, pos) => {
        const Tooltip = this.$attrs.ResultsTooltip;
        new Vue({
          el: tooltipDiv,

          render() {
            return <Tooltip pos={pos} />;
          }

        });
        return tooltipDiv;
      });
    }

    this.viewer = CodeMirror(this._node, {
      lineWrapping: true,
      value: this.$attrs.value || '',
      readOnly: true,
      theme: this.$attrs.editorTheme || 'graphiql',
      mode: 'graphql-results',
      keyMap: 'sublime',
      foldGutter: {
        minFoldSize: 4
      },
      gutters: ['CodeMirror-foldgutter'],
      info: Boolean(this.$attrs.ResultsTooltip),
      extraKeys: {
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
  },

  beforeDestroy() {
    this.viewer = null;
  },

  render() {
    return <div class="result-window" ref={node => {
      this._node = node;
    }} />;
  },

  methods: {
    shouldComponentUpdate(nextProps) {
      return this.$attrs.value !== nextProps.value;
    },

    componentDidUpdate() {
      this.viewer.setValue(this.$attrs.value || '');
    },

    getCodeMirror() {
      return this.viewer;
    },

    getClientHeight() {
      return this._node && this._node.clientHeight;
    }

  }
};