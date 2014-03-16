// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
  "use strict";

  var literals = {
    view: {},
    stat: {},
    f: {}
  };

  var app = WinJS.Application;
  var activation = Windows.ApplicationModel.Activation;

  literals.f.init = function () {
    literals.view.body = document.getElementById('body');

    // editor set
    literals.view.editorSet = flagrate.createElement('div', { 'class': 'editor-set' });
    literals.view.body.appendChild(literals.view.editorSet);

    // editor container
    literals.view.editorContainer = flagrate.createElement('div', { 'class': 'editor-container' });
    literals.view.editorSet.appendChild(literals.view.editorContainer);

    // editor status bar
    literals.view.statusBar = flagrate.createElement('div', { 'class': 'editor-status-bar' });
    literals.view.editorSet.appendChild(literals.view.statusBar);

    // test
    literals.stat.mode = 'text';
    literals.view.editor = CodeMirror(literals.view.editorContainer, {
      lineNumbers: true,
      value: 'hoge'
    });

    literals.view.statusBar.insertText('status bar');
  };

  app.onactivated = function (a) {
    if (a.detail.kind === activation.ActivationKind.launch) {
      literals.f.init();

      if (a.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
        // TODO: このアプリケーションは新しく起動しました。ここでアプリケーションを
        // 初期化します。
      } else {
        // TODO: このアプリケーションは中断状態から再度アクティブ化されました。
        // ここでアプリケーションの状態を復元します。
      }

      a.setPromise(WinJS.UI.processAll());
    }
  };

  app.oncheckpoint = function (args) {
    // TODO: このアプリケーションは中断しようとしています。ここで中断中に
    // 維持する必要のある状態を保存します。中断中に自動的に保存され、
    // 復元される WinJS.Application.sessionState オブジェクトを使用
    // できます。アプリケーションを中断する前に
    // 非同期操作を完了する必要がある場合は、
    // args.setPromise() を呼び出してください。
  };

  app.start();
})();
