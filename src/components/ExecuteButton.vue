<template>
  <div class="execute-button-wrap">
    <button
      type="button"
      class="execute-button"
      @mousedDown="onOptionsOpen"
      @click="onClick"
      title="Execute Query (Ctrl-Enter)">
      <svg width="34" height="34">
        <path v-if="isRunning" d="M 10 10 L 23 10 L 23 23 L 10 23 z" />
        <path v-else="isRunning" d="M 11 9 L 24 16 L 11 23 z" />
      </svg>
    </button>
    <ul class="execute-options" v-if="hasOptions && optionsOpen">
      <li
        v-for="operation of operations"
        :key="operation.name ? operation.name.value : '*'"
        :class="operation === highlight ? 'selected' : null"
        @mouseover="highlight = operation"
        @mouseout="highlight = null"
        @mouseup="onOptionSelected(operation)"
      >
        {{ operation.name ? operation.name.value : '<Unnamed>' }}
      </li>
    </ul>
  </div>
</template>
<script>
export default {
  name: 'ExecuteButton',
  componentName: 'ExecuteButton',
  props: {
    onRun: {
      type: Function
    },
    onStop: {
      type: Function
    },
    isRunning: {
      type: Boolean
    },
    operations: {
      type: Array
    }
  },
  data () {
    return {
      optionsOpen: false,
      highlight: null,
    }
  },
  computed: {
    hasOptions () {
      return operations && operations.length > 1
    }
  }
  methods: {
    onClick () {
      if (!(this.isRunning || !this.hasOptions)) {
        return
      }
      if (this.isRunning) {
        this.onStop()
      } else {
        this.onRun()
      }
    },
    onOptionSelected (operation) {
      this.optionsOpen = false
      this.onRun(operation.name && operation.name.value)
    },
    onOptionsOpen (downEvent) {
      if (!(this.isRunning && this.hasOptions && !this.optionsOpen)) {
        return
      }
      let initialPress = true
      const downTarget = downEvent.target
      this.highlight = null
      this.optionsOpen = true

      let onMouseUp = upEvent => {
        if (initialPress && upEvent.target === downTarget) {
          initialPress = false
        } else {
          document.removeEventListener('mouseup', onMouseUp);
          onMouseUp = null
          const isOptionsMenuClicked =
            downTarget.parentNode.compareDocumentPosition(upEvent.target) &
            Node.DOCUMENT_POSITION_CONTAINED_BY
          if (!isOptionsMenuClicked) {
            // menu calls setState if it was clicked
            this.optionsOpen = false
          }
        }
      }

      document.addEventListener('mouseup', onMouseUp);
    }
  }
}
</script>
