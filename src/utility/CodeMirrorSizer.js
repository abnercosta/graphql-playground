export default class CodeMirrorSizer {
  constructor() {
    this.sizes = [];
  }

  updateSizes(components) {
    components.forEach((component, i) => {
      const size = component.getClientHeight();
      if (i <= this.sizes.length && size !== this.sizes[i]) {
        component.getCodeMirror().setSize();
      }
      this.sizes[i] = size;
    });
  }
}
