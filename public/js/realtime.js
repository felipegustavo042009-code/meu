const RealtimeManager = {
  subscriptions: {},

  subscribeToAlunos(salaId, callback) {
    const channel = supabaseClient
      .channel(`alunos-${salaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'alunos_conectados',
          filter: `sala_id=eq.${salaId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    this.subscriptions[`alunos-${salaId}`] = channel;
    return channel;
  },

  subscribeToPerguntas(salaId, callback) {
    const channel = supabaseClient
      .channel(`perguntas-${salaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'perguntas_alunos',
          filter: `sala_id=eq.${salaId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    this.subscriptions[`perguntas-${salaId}`] = channel;
    return channel;
  },

  subscribeToQuizzes(salaId, callback) {
    const channel = supabaseClient
      .channel(`quizzes-${salaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quizzes',
          filter: `sala_id=eq.${salaId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    this.subscriptions[`quizzes-${salaId}`] = channel;
    return channel;
  },

  subscribeToRespostasQuiz(quizId, callback) {
    const channel = supabaseClient
      .channel(`respostas-${quizId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'respostas_quiz',
          filter: `quiz_id=eq.${quizId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    this.subscriptions[`respostas-${quizId}`] = channel;
    return channel;
  },

  subscribeToAtividades(salaId, callback) {
    const channel = supabaseClient
      .channel(`atividades-${salaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'atividades',
          filter: `sala_id=eq.${salaId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    this.subscriptions[`atividades-${salaId}`] = channel;
    return channel;
  },

  subscribeToMateriais(salaId, callback) {
    const channel = supabaseClient
      .channel(`materiais-${salaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'materiais',
          filter: `sala_id=eq.${salaId}`
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();

    this.subscriptions[`materiais-${salaId}`] = channel;
    return channel;
  },

  unsubscribe(channelName) {
    if (this.subscriptions[channelName]) {
      supabaseClient.removeChannel(this.subscriptions[channelName]);
      delete this.subscriptions[channelName];
    }
  },

  unsubscribeAll() {
    Object.keys(this.subscriptions).forEach(key => {
      supabaseClient.removeChannel(this.subscriptions[key]);
    });
    this.subscriptions = {};
  }
};

window.RealtimeManager = RealtimeManager;
