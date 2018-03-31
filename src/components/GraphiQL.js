import Vue from "vue";
import { buildClientSchema, GraphQLSchema, parse, print } from 'graphql';
import { ExecuteButton } from './ExecuteButton';
import { ToolbarButton } from './ToolbarButton';
import { ToolbarGroup } from './ToolbarGroup';
import { ToolbarMenu, ToolbarMenuItem } from './ToolbarMenu';
import { ToolbarSelect, ToolbarSelectOption } from './ToolbarSelect';
import { QueryEditor } from './QueryEditor';
import { VariableEditor } from './VariableEditor';
import { ResultViewer } from './ResultViewer';
import { DocExplorer } from './DocExplorer';
import { QueryHistory } from './QueryHistory';
import CodeMirrorSizer from '../utility/CodeMirrorSizer';
import StorageAPI from '../utility/StorageAPI';
import getQueryFacts from '../utility/getQueryFacts';
import getSelectedOperationName from '../utility/getSelectedOperationName';
import debounce from '../utility/debounce';
import find from '../utility/find';
import { fillLeafs } from '../utility/fillLeafs';
import { getLeft, getTop } from '../utility/elementPosition';
import { introspectionQuery, introspectionQuerySansSubscriptions } from '../utility/introspectionQueries';
const DEFAULT_DOC_EXPLORER_WIDTH = 350;
/**
 * The top-level React component for GraphiQL, intended to encompass the entire
 * browser viewport.
 *
 * @see https://github.com/graphql/graphiql#usage
 */

export const GraphiQL = {
  data() {
    var props = this.$props;

    // Ensure props are correct
    if (typeof props.fetcher !== 'function') {
      throw new TypeError('GraphiQL requires a fetcher function.');
    } // Cache the storage instance


    this._storage = new StorageAPI(props.storage); // Determine the initial query to display.

    const query = props.query !== undefined ? props.query : this._storage.get('query') !== null ? this._storage.get('query') : props.defaultQuery !== undefined ? props.defaultQuery : defaultQuery; // Get the initial query facts.

    const queryFacts = getQueryFacts(props.schema, query); // Determine the initial variables to display.

    const variables = props.variables !== undefined ? props.variables : this._storage.get('variables'); // Determine the initial operationName to use.

    const operationName = props.operationName !== undefined ? props.operationName : getSelectedOperationName(null, this._storage.get('operationName'), queryFacts && queryFacts.operations); // Initialize state

    this.__state = {
      schema: props.schema,
      query,
      variables,
      operationName,
      response: props.response,
      editorFlex: Number(this._storage.get('editorFlex')) || 1,
      variableEditorOpen: Boolean(variables),
      variableEditorHeight: Number(this._storage.get('variableEditorHeight')) || 200,
      docExplorerOpen: this._storage.get('docExplorerOpen') === 'true' || false,
      historyPaneOpen: this._storage.get('historyPaneOpen') === 'true' || false,
      docExplorerWidth: Number(this._storage.get('docExplorerWidth')) || DEFAULT_DOC_EXPLORER_WIDTH,
      isWaitingForResponse: false,
      subscription: null,
      ...queryFacts
    }; // Ensure only the last executed editor query is rendered.

    this._editorQueryID = 0; // Subscribe to the browser window closing, treating it as an unmount.

    if (typeof window === 'object') {
      window.addEventListener('beforeunload', () => this.componentWillUnmount());
    }

    return this.__state;
  },

  mounted() {
    // Only fetch schema via introspection if a schema has not been
    // provided, including if `null` was provided.
    if (this.$data.schema === undefined) {
      this._fetchSchema();
    } // Utility for keeping CodeMirror correctly sized.


    this.codeMirrorSizer = new CodeMirrorSizer();
    global.g = this;
  },

  beforeDestroy() {
    this._storage.set('query', this.$data.query);

    this._storage.set('variables', this.$data.variables);

    this._storage.set('operationName', this.$data.operationName);

    this._storage.set('editorFlex', this.$data.editorFlex);

    this._storage.set('variableEditorHeight', this.$data.variableEditorHeight);

    this._storage.set('docExplorerWidth', this.$data.docExplorerWidth);

    this._storage.set('docExplorerOpen', this.$data.docExplorerOpen);

    this._storage.set('historyPaneOpen', this.$data.historyPaneOpen);
  },

  render() {
    const children = React.Children.toArray(this.$children);
    const logo = find(children, child => child.type === GraphiQL.Logo) || <GraphiQL.Logo />;
    const toolbar = find(children, child => child.type === GraphiQL.Toolbar) || <GraphiQL.Toolbar>
        <ToolbarButton onClick={this.handlePrettifyQuery} title="Prettify Query (Shift-Ctrl-P)" label="Prettify" />
        <ToolbarButton onClick={this.handleToggleHistory} title="Show History" label="History" />

      </GraphiQL.Toolbar>;
    const footer = find(children, child => child.type === GraphiQL.Footer);
    const queryWrapStyle = {
      WebkitFlex: this.$data.editorFlex,
      flex: this.$data.editorFlex
    };
    const docWrapStyle = {
      display: this.$data.docExplorerOpen ? 'block' : 'none',
      width: this.$data.docExplorerWidth
    };
    const docExplorerWrapClasses = 'docExplorerWrap' + (this.$data.docExplorerWidth < 200 ? ' doc-explorer-narrow' : '');
    const historyPaneStyle = {
      display: this.$data.historyPaneOpen ? 'block' : 'none',
      width: '230px',
      zIndex: '7'
    };
    const variableOpen = this.$data.variableEditorOpen;
    const variableStyle = {
      height: variableOpen ? this.$data.variableEditorHeight : null
    };
    return <div class="graphiql-container">
        <div class="historyPaneWrap" style={historyPaneStyle}>
          <QueryHistory operationName={this.$data.operationName} query={this.$data.query} variables={this.$data.variables} onSelectQuery={this.handleSelectHistoryQuery} storage={this._storage} queryID={this._editorQueryID}>
            <div class="docExplorerHide" onClick={this.handleToggleHistory}>
              {'\u2715'}
            </div>
          </QueryHistory>
        </div>
        <div class="editorWrap">
          <div class="topBarWrap">
            <div class="topBar">
              {logo}
              <ExecuteButton isRunning={Boolean(this.$data.subscription)} onRun={this.handleRunQuery} onStop={this.handleStopQuery} operations={this.$data.operations} />
              {toolbar}
            </div>
            {!this.$data.docExplorerOpen && <button class="docExplorerShow" onClick={this.handleToggleDocs}>
                {'Docs'}
              </button>}
          </div>
          <div ref={n => {
          this.editorBarComponent = n;
        }} class="editorBar" onDoubleClick={this.handleResetResize} onMouseDown={this.handleResizeStart}>
            <div class="queryWrap" style={queryWrapStyle}>
              <QueryEditor ref={n => {
              this.queryEditorComponent = n;
            }} schema={this.$data.schema} value={this.$data.query} onEdit={this.handleEditQuery} onHintInformationRender={this.handleHintInformationRender} onClickReference={this.handleClickReference} onPrettifyQuery={this.handlePrettifyQuery} onRunQuery={this.handleEditorRunQuery} editorTheme={this.$attrs.editorTheme} />
              <div class="variable-editor" style={variableStyle}>
                <div class="variable-editor-title" style={{
                cursor: variableOpen ? 'row-resize' : 'n-resize'
              }} onMouseDown={this.handleVariableResizeStart}>
                  {'Query Variables'}
                </div>
                <VariableEditor ref={n => {
                this.variableEditorComponent = n;
              }} value={this.$data.variables} variableToType={this.$data.variableToType} onEdit={this.handleEditVariables} onHintInformationRender={this.handleHintInformationRender} onPrettifyQuery={this.handlePrettifyQuery} onRunQuery={this.handleEditorRunQuery} editorTheme={this.$attrs.editorTheme} />
              </div>
            </div>
            <div class="resultWrap">
              {this.$data.isWaitingForResponse && <div class="spinner-container">
                  <div class="spinner" />
                </div>}
              <ResultViewer ref={c => {
              this.resultComponent = c;
            }} value={this.$data.response} editorTheme={this.$attrs.editorTheme} ResultsTooltip={this.$attrs.ResultsTooltip} />
              {footer}
            </div>
          </div>
        </div>
        <div class={docExplorerWrapClasses} style={docWrapStyle}>
          <div class="docExplorerResizer" onDoubleClick={this.handleDocsResetResize} onMouseDown={this.handleDocsResizeStart} />
          <DocExplorer ref={c => {
          this.docExplorerComponent = c;
        }} schema={this.$data.schema}>
            <div class="docExplorerHide" onClick={this.handleToggleDocs}>
              {'\u2715'}
            </div>
          </DocExplorer>
        </div>
      </div>;
  },

  methods: {
    componentWillReceiveProps(nextProps) {
      let nextSchema = this.$data.schema;
      let nextQuery = this.$data.query;
      let nextVariables = this.$data.variables;
      let nextOperationName = this.$data.operationName;
      let nextResponse = this.$data.response;

      if (nextProps.schema !== undefined) {
        nextSchema = nextProps.schema;
      }

      if (nextProps.query !== undefined) {
        nextQuery = nextProps.query;
      }

      if (nextProps.variables !== undefined) {
        nextVariables = nextProps.variables;
      }

      if (nextProps.operationName !== undefined) {
        nextOperationName = nextProps.operationName;
      }

      if (nextProps.response !== undefined) {
        nextResponse = nextProps.response;
      }

      if (nextSchema !== this.$data.schema || nextQuery !== this.$data.query || nextOperationName !== this.$data.operationName) {
        const updatedQueryAttributes = this._updateQueryFacts(nextQuery, nextOperationName, this.$data.operations, nextSchema);

        if (updatedQueryAttributes !== undefined) {
          nextOperationName = updatedQueryAttributes.operationName;
          this.setState(updatedQueryAttributes);
        }
      } // If schema is not supplied via props and the fetcher changed, then
      // remove the schema so fetchSchema() will be called with the new fetcher.


      if (nextProps.schema === undefined && nextProps.fetcher !== this.$attrs.fetcher) {
        nextSchema = undefined;
      }

      this.setState({
        schema: nextSchema,
        query: nextQuery,
        variables: nextVariables,
        operationName: nextOperationName,
        response: nextResponse
      }, () => {
        if (this.$data.schema === undefined) {
          this.docExplorerComponent.reset();

          this._fetchSchema();
        }
      });
    },

    componentDidUpdate() {
      // If this update caused DOM nodes to have changed sizes, update the
      // corresponding CodeMirror instance sizes to match.
      this.codeMirrorSizer.updateSizes([this.queryEditorComponent, this.variableEditorComponent, this.resultComponent]);
    },

    getQueryEditor() {
      return this.queryEditorComponent.getCodeMirror();
    },

    getVariableEditor() {
      return this.variableEditorComponent.getCodeMirror();
    },

    refresh() {
      this.queryEditorComponent.getCodeMirror().refresh();
      this.variableEditorComponent.getCodeMirror().refresh();
      this.resultComponent.getCodeMirror().refresh();
    },

    autoCompleteLeafs() {
      const {
        insertions,
        result
      } = fillLeafs(this.$data.schema, this.$data.query, this.$attrs.getDefaultFieldNames);

      if (insertions && insertions.length > 0) {
        const editor = this.getQueryEditor();
        editor.operation(() => {
          const cursor = editor.getCursor();
          const cursorIndex = editor.indexFromPos(cursor);
          editor.setValue(result);
          let added = 0;
          const markers = insertions.map(({
            index,
            string
          }) => editor.markText(editor.posFromIndex(index + added), editor.posFromIndex(index + (added += string.length)), {
            className: 'autoInsertedLeaf',
            clearOnEnter: true,
            title: 'Automatically added leaf fields'
          }));
          setTimeout(() => markers.forEach(marker => marker.clear()), 7000);
          let newCursorIndex = cursorIndex;
          insertions.forEach(({
            index,
            string
          }) => {
            if (index < cursorIndex) {
              newCursorIndex += string.length;
            }
          });
          editor.setCursor(editor.posFromIndex(newCursorIndex));
        });
      }

      return result;
    },

    _fetchSchema() {
      const fetcher = this.$attrs.fetcher;
      const fetch = observableToPromise(fetcher({
        query: introspectionQuery
      }));

      if (!isPromise(fetch)) {
        this.response = 'Fetcher did not return a Promise for introspection.';
        return;
      }

      fetch.then(result => {
        if (result.data) {
          return result;
        } // Try the stock introspection query first, falling back on the
        // sans-subscriptions query for services which do not yet support it.


        const fetch2 = observableToPromise(fetcher({
          query: introspectionQuerySansSubscriptions
        }));

        if (!isPromise(fetch)) {
          throw new Error('Fetcher did not return a Promise for introspection.');
        }

        return fetch2;
      }).then(result => {
        // If a schema was provided while this fetch was underway, then
        // satisfy the race condition by respecting the already
        // provided schema.
        if (this.$data.schema !== undefined) {
          return;
        }

        if (result && result.data) {
          const schema = buildClientSchema(result.data);
          const queryFacts = getQueryFacts(schema, this.$data.query);
          this.schema = schema;
        } else {
          const responseString = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
          this.schema = null, this.response = responseString;
        }
      }).catch(error => {
        this.schema = null, this.response = error && String(error.stack || error);
      });
    },

    _fetchQuery(query, variables, operationName, cb) {
      const fetcher = this.$attrs.fetcher;
      let jsonVariables = null;

      try {
        jsonVariables = variables && variables.trim() !== '' ? JSON.parse(variables) : null;
      } catch (error) {
        throw new Error(`Variables are invalid JSON: ${error.message}.`);
      }

      if (typeof jsonVariables !== 'object') {
        throw new Error('Variables are not a JSON object.');
      }

      const fetch = fetcher({
        query,
        variables: jsonVariables,
        operationName
      });

      if (isPromise(fetch)) {
        // If fetcher returned a Promise, then call the callback when the promise
        // resolves, otherwise handle the error.
        fetch.then(cb).catch(error => {
          this.isWaitingForResponse = false, this.response = error && String(error.stack || error);
        });
      } else if (isObservable(fetch)) {
        // If the fetcher returned an Observable, then subscribe to it, calling
        // the callback on each next value, and handling both errors and the
        // completion of the Observable. Returns a Subscription object.
        const subscription = fetch.subscribe({
          next: cb,
          error: error => {
            this.isWaitingForResponse = false, this.response = error && String(error.stack || error), this.subscription = null;
          },
          complete: () => {
            this.isWaitingForResponse = false, this.subscription = null;
          }
        });
        return subscription;
      } else {
        throw new Error('Fetcher did not return Promise or Observable.');
      }
    },

    handleClickReference(reference) {
      this.setState({
        docExplorerOpen: true
      }, () => {
        this.docExplorerComponent.showDocForReference(reference);
      });
    },

    handleRunQuery(selectedOperationName) {
      this._editorQueryID++;
      const queryID = this._editorQueryID; // Use the edited query after autoCompleteLeafs() runs or,
      // in case autoCompletion fails (the function returns undefined),
      // the current query from the editor.

      const editedQuery = this.autoCompleteLeafs() || this.$data.query;
      const variables = this.$data.variables;
      let operationName = this.$data.operationName; // If an operation was explicitly provided, different from the current
      // operation name, then report that it changed.

      if (selectedOperationName && selectedOperationName !== operationName) {
        operationName = selectedOperationName;
        this.handleEditOperationName(operationName);
      }

      try {
        this.isWaitingForResponse = true, this.response = null, this.operationName = operationName; // _fetchQuery may return a subscription.

        const subscription = this._fetchQuery(editedQuery, variables, operationName, result => {
          if (queryID === this._editorQueryID) {
            this.isWaitingForResponse = false, this.response = JSON.stringify(result, null, 2);
          }
        });

        this.subscription = subscription;
      } catch (error) {
        this.isWaitingForResponse = false, this.response = error.message;
      }
    },

    handleStopQuery() {
      const subscription = this.$data.subscription;
      this.isWaitingForResponse = false, this.subscription = null;

      if (subscription) {
        subscription.unsubscribe();
      }
    },

    _runQueryAtCursor() {
      if (this.$data.subscription) {
        this.handleStopQuery();
        return;
      }

      let operationName;
      const operations = this.$data.operations;

      if (operations) {
        const editor = this.getQueryEditor();

        if (editor.hasFocus()) {
          const cursor = editor.getCursor();
          const cursorIndex = editor.indexFromPos(cursor); // Loop through all operations to see if one contains the cursor.

          for (let i = 0; i < operations.length; i++) {
            const operation = operations[i];

            if (operation.loc.start <= cursorIndex && operation.loc.end >= cursorIndex) {
              operationName = operation.name && operation.name.value;
              break;
            }
          }
        }
      }

      this.handleRunQuery(operationName);
    },

    handlePrettifyQuery() {
      const editor = this.getQueryEditor();
      editor.setValue(print(parse(editor.getValue())));
    },

    _updateQueryFacts(query, operationName, prevOperations, schema) {
      const queryFacts = getQueryFacts(schema, query);

      if (queryFacts) {
        // Update operation name should any query names change.
        const updatedOperationName = getSelectedOperationName(prevOperations, operationName, queryFacts.operations); // Report changing of operationName if it changed.

        const onEditOperationName = this.$attrs.onEditOperationName;

        if (onEditOperationName && operationName !== updatedOperationName) {
          onEditOperationName(updatedOperationName);
        }

        return {
          operationName: updatedOperationName,
          ...queryFacts
        };
      }
    },

    handleEditVariables(value) {
      this.variables = value;

      if (this.$attrs.onEditVariables) {
        this.$emit("editVariables", value);
      }
    },

    handleEditOperationName(operationName) {
      const onEditOperationName = this.$attrs.onEditOperationName;

      if (onEditOperationName) {
        onEditOperationName(operationName);
      }
    },

    handleHintInformationRender(elem) {
      elem.addEventListener('click', this._onClickHintInformation);
      let onRemoveFn;
      elem.addEventListener('DOMNodeRemoved', onRemoveFn = () => {
        elem.removeEventListener('DOMNodeRemoved', onRemoveFn);
        elem.removeEventListener('click', this._onClickHintInformation);
      });
    },

    handleEditorRunQuery() {
      this._runQueryAtCursor();
    },

    _onClickHintInformation(event) {
      if (event.target.className === 'typeName') {
        const typeName = event.target.innerHTML;
        const schema = this.$data.schema;

        if (schema) {
          const type = schema.getType(typeName);

          if (type) {
            this.setState({
              docExplorerOpen: true
            }, () => {
              this.docExplorerComponent.showDoc(type);
            });
          }
        }
      }
    },

    handleToggleDocs() {
      if (typeof this.$attrs.onToggleDocs === 'function') {
        this.$emit("toggleDocs", !this.$data.docExplorerOpen);
      }

      this.docExplorerOpen = !this.$data.docExplorerOpen;
    },

    handleToggleHistory() {
      if (typeof this.$attrs.onToggleHistory === 'function') {
        this.$emit("toggleHistory", !this.$data.historyPaneOpen);
      }

      this.historyPaneOpen = !this.$data.historyPaneOpen;
    },

    handleSelectHistoryQuery(query, variables, operationName) {
      this.handleEditQuery(query);
      this.handleEditVariables(variables);
      this.handleEditOperationName(operationName);
    },

    handleResizeStart(downEvent) {
      if (!this._didClickDragBar(downEvent)) {
        return;
      }

      downEvent.preventDefault();
      const offset = downEvent.clientX - getLeft(downEvent.target);

      let onMouseMove = moveEvent => {
        if (moveEvent.buttons === 0) {
          return onMouseUp();
        }

        const editorBar = ReactDOM.findDOMNode(this.editorBarComponent);
        const leftSize = moveEvent.clientX - getLeft(editorBar) - offset;
        const rightSize = editorBar.clientWidth - leftSize;
        this.editorFlex = leftSize / rightSize;
      };

      let onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        onMouseMove = null;
        onMouseUp = null;
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },

    handleResetResize() {
      this.editorFlex = 1;
    },

    _didClickDragBar(event) {
      // Only for primary unmodified clicks
      if (event.button !== 0 || event.ctrlKey) {
        return false;
      }

      let target = event.target; // We use codemirror's gutter as the drag bar.

      if (target.className.indexOf('CodeMirror-gutter') !== 0) {
        return false;
      } // Specifically the result window's drag bar.


      const resultWindow = ReactDOM.findDOMNode(this.resultComponent);

      while (target) {
        if (target === resultWindow) {
          return true;
        }

        target = target.parentNode;
      }

      return false;
    },

    handleDocsResizeStart(downEvent) {
      downEvent.preventDefault();
      const hadWidth = this.$data.docExplorerWidth;
      const offset = downEvent.clientX - getLeft(downEvent.target);

      let onMouseMove = moveEvent => {
        if (moveEvent.buttons === 0) {
          return onMouseUp();
        }

        const app = ReactDOM.findDOMNode(this);
        const cursorPos = moveEvent.clientX - getLeft(app) - offset;
        const docsSize = app.clientWidth - cursorPos;

        if (docsSize < 100) {
          this.docExplorerOpen = false;
        } else {
          this.docExplorerOpen = true, this.docExplorerWidth = Math.min(docsSize, 650);
        }
      };

      let onMouseUp = () => {
        if (!this.$data.docExplorerOpen) {
          this.docExplorerWidth = hadWidth;
        }

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        onMouseMove = null;
        onMouseUp = null;
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },

    handleDocsResetResize() {
      this.docExplorerWidth = DEFAULT_DOC_EXPLORER_WIDTH;
    },

    handleVariableResizeStart(downEvent) {
      downEvent.preventDefault();
      let didMove = false;
      const wasOpen = this.$data.variableEditorOpen;
      const hadHeight = this.$data.variableEditorHeight;
      const offset = downEvent.clientY - getTop(downEvent.target);

      let onMouseMove = moveEvent => {
        if (moveEvent.buttons === 0) {
          return onMouseUp();
        }

        didMove = true;
        const editorBar = ReactDOM.findDOMNode(this.editorBarComponent);
        const topSize = moveEvent.clientY - getTop(editorBar) - offset;
        const bottomSize = editorBar.clientHeight - topSize;

        if (bottomSize < 60) {
          this.variableEditorOpen = false, this.variableEditorHeight = hadHeight;
        } else {
          this.variableEditorOpen = true, this.variableEditorHeight = bottomSize;
        }
      };

      let onMouseUp = () => {
        if (!didMove) {
          this.variableEditorOpen = !wasOpen;
        }

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        onMouseMove = null;
        onMouseUp = null;
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

  }
}; // Configure the UI by providing this Component as a child of GraphiQL.

GraphiQL.Logo = function GraphiQLLogo(props) {
  return <div className="title">
      {props.children || <span>{'Graph'}<em>{'i'}</em>{'QL'}</span>}
    </div>;
}; // Configure the UI by providing this Component as a child of GraphiQL.


GraphiQL.Toolbar = function GraphiQLToolbar(props) {
  return <div className="toolbar">
      {props.children}
    </div>;
}; // Export main windows/panes to be used separately if desired.


GraphiQL.QueryEditor = QueryEditor;
GraphiQL.VariableEditor = VariableEditor;
GraphiQL.ResultViewer = ResultViewer; // Add a button to the Toolbar.

GraphiQL.Button = ToolbarButton;
GraphiQL.ToolbarButton = ToolbarButton; // Don't break existing API.
// Add a group of buttons to the Toolbar

GraphiQL.Group = ToolbarGroup; // Add a menu of items to the Toolbar.

GraphiQL.Menu = ToolbarMenu;
GraphiQL.MenuItem = ToolbarMenuItem; // Add a select-option input to the Toolbar.

GraphiQL.Select = ToolbarSelect;
GraphiQL.SelectOption = ToolbarSelectOption; // Configure the UI by providing this Component as a child of GraphiQL.

GraphiQL.Footer = function GraphiQLFooter(props) {
  return <div className="footer">
      {props.children}
    </div>;
};

const defaultQuery = `# Welcome to GraphiQL
#
# GraphiQL is an in-browser tool for writing, validating, and
# testing GraphQL queries.
#
# Type queries into this side of the screen, and you will see intelligent
# typeaheads aware of the current GraphQL type schema and live syntax and
# validation errors highlighted within the text.
#
# GraphQL queries typically start with a "{" character. Lines that starts
# with a # are ignored.
#
# An example GraphQL query might look like:
#
#     {
#       field(arg: "value") {
#         subField
#       }
#     }
#
# Keyboard shortcuts:
#
#  Prettify Query:  Shift-Ctrl-P (or press the prettify button above)
#
#       Run Query:  Ctrl-Enter (or press the play button above)
#
#   Auto Complete:  Ctrl-Space (or just start typing)
#

`; // Duck-type promise detection.

function isPromise(value) {
  return typeof value === 'object' && typeof value.then === 'function';
} // Duck-type Observable.take(1).toPromise()


function observableToPromise(observable) {
  if (!isObservable(observable)) {
    return observable;
  }

  return new Promise((resolve, reject) => {
    const subscription = observable.subscribe(v => {
      resolve(v);
      subscription.unsubscribe();
    }, reject, () => {
      reject(new Error('no value resolved'));
    });
  });
} // Duck-type observable detection.


function isObservable(value) {
  return typeof value === 'object' && typeof value.subscribe === 'function';
}