import { parse } from 'graphql';
import QueryStore from '../utility/QueryStore';
import HistoryQuery from './HistoryQuery';

const shouldSaveQuery = (nextProps, current, lastQuerySaved) => {
  if (nextProps.queryID === current.queryID) {
    return false;
  }

  try {
    parse(nextProps.query);
  } catch (e) {
    return false;
  }

  if (!lastQuerySaved) {
    return true;
  }

  if (JSON.stringify(nextProps.query) === JSON.stringify(lastQuerySaved.query)) {
    if (JSON.stringify(nextProps.variables) === JSON.stringify(lastQuerySaved.variables)) {
      return false;
    }

    if (!nextProps.variables && !lastQuerySaved.variables) {
      return false;
    }
  }

  return true;
};

const MAX_HISTORY_LENGTH = 20;
export const QueryHistory = {
  data() {
    var props = this.$props;
    this.historyStore = new QueryStore('queries', props.storage);
    this.favoriteStore = new QueryStore('favorites', props.storage);
    const historyQueries = this.historyStore.fetchAll();
    const favoriteQueries = this.favoriteStore.fetchAll();
    const queries = historyQueries.concat(favoriteQueries);
    this.__state = {
      queries
    };
    return this.__state;
  },

  render() {
    const queries = this.$data.queries.slice().reverse();
    const queryNodes = queries.map((query, i) => {
      return <HistoryQuery handleToggleFavorite={this.toggleFavorite} key={i} onSelect={this.$attrs.onSelectQuery} {...query} />;
    });
    return <div>
        <div class="history-title-bar">
          <div class="history-title">{'History'}</div>
          <div class="doc-explorer-rhs">
            {this.$children}
          </div>
        </div>
        <div class="history-contents">
          {queryNodes}
        </div>
      </div>;
  },

  methods: {
    componentWillReceiveProps(nextProps) {
      if (shouldSaveQuery(nextProps, this.$attrs, this.historyStore.fetchRecent())) {
        const item = {
          query: nextProps.query,
          variables: nextProps.variables,
          operationName: nextProps.operationName
        };
        this.historyStore.push(item);

        if (this.historyStore.length > MAX_HISTORY_LENGTH) {
          this.historyStore.shift();
        }

        const historyQueries = this.historyStore.items;
        const favoriteQueries = this.favoriteStore.items;
        const queries = historyQueries.concat(favoriteQueries);
        this.queries = queries;
      }
    },

    toggleFavorite(query, variables, operationName, favorite) {
      const item = {
        query,
        variables,
        operationName
      };

      if (!this.favoriteStore.contains(item)) {
        item.favorite = true;
        this.favoriteStore.push(item);
      } else if (favorite) {
        item.favorite = false;
        this.favoriteStore.delete(item);
      }

      const historyQueries = this.historyStore.items;
      const favoriteQueries = this.favoriteStore.items;
      const queries = historyQueries.concat(favoriteQueries);
      this.queries = queries;
    }

  }
};