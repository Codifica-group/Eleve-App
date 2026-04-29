class FeedbackManager {
  static feedbackRef = null;

  // Recebe a referência do componente montado
  static setRef(ref) {
    this.feedbackRef = ref;
  }

  static show(message, type = 'success') {
    if (this.feedbackRef) {
      this.feedbackRef.show(message, type);
    }
  }

  // Atalhos práticos
  static success(message) {
    this.show(message, 'success');
  }

  static error(message) {
    this.show(message, 'error');
  }
}

export default FeedbackManager;