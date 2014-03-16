// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
  "use strict";

  var app = WinJS.Application;
  var Activation = Windows.ApplicationModel.Activation;
  var AccessList = Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList;
  var FileIO = Windows.Storage.FileIO;

  var literals = {
    view: {},
    stat: {},
    f: {},
    def: {},
    config: {},
    sessions: []
  };

  //
  // default configs
  //

  // global config
  literals.config.global = {
    useTabChar: false,
    tabSize: 4,
    spaceUnits: 2,
    closeBrackets: false,
    showLineNumbers: true,
    styleActiveLine: true,
    wordWrap: true
  };

  // .txt config
  literals.config.txt = flagrate.extendObject({}, literals.config.global);
  literals.config.txt.mode = 'plain_text';
  literals.config.txt.useTabChar = true;
  literals.config.txt.styleActiveLine = false;


  // .xml config
  literals.config.xml = flagrate.extendObject({}, literals.config.global);
  literals.config.xml.mode = 'xml';

  // .svg config
  literals.config.svg = flagrate.extendObject({}, literals.config.global);
  literals.config.svg.mode = 'svg';

  // .html config
  literals.config.html = flagrate.extendObject({}, literals.config.global);
  literals.config.htm = literals.config.html;// .htm alias
  literals.config.html.mode = 'html';

  // .css config
  literals.config.css = flagrate.extendObject({}, literals.config.global);
  literals.config.css.mode = 'css';

  // .less config
  literals.config.less = flagrate.extendObject({}, literals.config.global);
  literals.config.less.mode = 'less';

  // .sass config
  literals.config.sass = flagrate.extendObject({}, literals.config.global);
  literals.config.sass.mode = 'sass';

  // .scss config
  literals.config.scss = flagrate.extendObject({}, literals.config.global);
  literals.config.scss.mode = 'scss';

  // .js config
  literals.config.js = flagrate.extendObject({}, literals.config.global);
  literals.config.js.mode = 'javascript';

  // .ts config
  literals.config.ts = flagrate.extendObject({}, literals.config.global);
  literals.config.ts.mode = 'typescript';

  // .jsx config
  literals.config.jsx = flagrate.extendObject({}, literals.config.global);
  literals.config.jsx.mode = 'jsx';

  // .hx config
  literals.config.hx = flagrate.extendObject({}, literals.config.global);
  literals.config.hxml = literals.config.hx;// .hxml alias
  literals.config.hx.mode = 'haxe';

  // .coffee config
  literals.config.coffee = flagrate.extendObject({}, literals.config.global);
  literals.config.coffee.mode = 'coffee';

  // .as config
  literals.config.as = flagrate.extendObject({}, literals.config.global);
  literals.config.as.mode = 'actionscript';

  // .json config
  literals.config.json = flagrate.extendObject({}, literals.config.global);
  literals.config.json.mode = 'json';

  //
  // functions
  //

  // init
  literals.f.init = function () {
    literals.view.body = document.getElementById('body');

    // editor set
    literals.view.editorSet = flagrate.createElement('div', { 'class': 'editor-set' });
    literals.view.editorSet.insertTo(literals.view.body);

    // editor container
    literals.view.editorContainer = flagrate.createElement('div', { 'class': 'editor-container' });
    literals.view.editorContainer.insertTo(literals.view.editorSet);

    // editor status bar
    literals.view.statusBar = flagrate.createElement('div', { 'class': 'editor-status-bar' });
    literals.view.statusBar.insertTo(literals.view.editorSet);

    // TODO:
    literals.view.statusBar.insert('<ul><li>test</li><li>test</li><li>test</li></ul>');
  };

  // create session
  literals.f.createSession = function () {
    var session = {
      name: null,
      type: 'txt',
      content: '',
      file: {}
    };

    literals.sessions.push(session);

    return session;
  };

  // create session by file
  literals.f.createSessionByFile = function (file) {
    // TODO: check if a file is already open.

    var session = {
      name: file.name,
      type: file.fileType.toLowerCase(),
      content: null,
      file: {
        path: file.path,
        token: AccessList.add(file)
      }
    };

    literals.sessions.push(session);

    return session;
  };

  // select session
  literals.f.selectSession = function (session) {
    literals.stat.session = session;

    if (session.content === null && typeof session.file.token === 'string') {
      AccessList.getFileAsync(session.file.token).done(function (file) {
        FileIO.readTextAsync(file).done(function (content) {
          session.content = content;
          literals.f.initSession();
        });
      });
    } else {
      literals.f.initSession();
    }

    return session;
  };

  // init session
  literals.f.initSession = function () {
    // clear editor
    literals.view.editor = null;
    literals.view.editorContainer.update();

    // create editor
    literals.view.editor = CodeMirror(literals.view.editorContainer, {
      lineNumbers: true,
      value: literals.stat.session.content
    });
  };

  //
  // init
  //

  // activated
  app.onactivated = function (e) {
    if (e.detail.kind === Activation.ActivationKind.launch) {
      literals.f.init();

      if (e.detail.previousExecutionState !== Activation.ApplicationExecutionState.terminated) {
        // TODO: newly started.
      } else {
        // TODO: resume.
      }

      //e.setPromise(WinJS.UI.processAll());
    }

    if (e.detail.kind === Activation.ActivationKind.file) {
      var files = e.detail.files;

      // create sessions
      files.forEach(function (file) {
        literals.f.createSessionByFile(file);
      });

      // select latest session
      literals.f.selectSession(literals.sessions[literals.sessions.length - 1]);
    } else {
      if (literals.sessions.length === 0) {
        literals.f.selectSession(literals.f.createSession());
      }
    }
  };

  // checkpoint
  app.oncheckpoint = function (e) {
    // TODO: terminating. use WinJS.Application.sessionState object.
    // if async operation needed, call the e.setPromise() method.
  };

  // start
  app.start();
}());
