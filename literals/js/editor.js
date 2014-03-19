// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
  "use strict";

  var app = WinJS.Application;
  var Activation = Windows.ApplicationModel.Activation;
  var AccessList = Windows.Storage.AccessCache.StorageApplicationPermissions.futureAccessList;
  var FileIO = Windows.Storage.FileIO;

  var ResourcesGetString = WinJS.Resources.getString;
  var _L = function (string) {
    return ResourcesGetString(string).value;
  };

  var literals = window.app = {
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
    showInvisibles: true,
    wordWrap: true,
    fontSize: 12,
    lineHeight: 1.25,
    keyBinding: null,
    theme: 'tomorrow'
  };

  // .txt config
  literals.config.txt = flagrate.extendObject({}, literals.config.global);
  literals.config.txt.mode = 'plain_text';
  literals.config.txt.useTabChar = true;
  literals.config.txt.styleActiveLine = false;
  literals.config.txt.showInvisibles = false;

  // .md config
  literals.config.md = flagrate.extendObject({}, literals.config.global);
  literals.config.md.mode = 'markdown';

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
    if (literals.stat.init) {
      return;
    }
    literals.stat.init = true;

    literals.view.body = document.getElementById('body');

    // tab
    literals.view.tab = flagrate.createTab({ className: 'tab', bodyless: true });
    literals.view.tab.insertTo(literals.view.body);

    // editor container
    literals.view.editorContainer = flagrate.createElement('div', { 'class': 'editor-container' });
    literals.view.editorContainer.insertTo(literals.view.body);

    // editor status bar
    literals.view.statusBar = flagrate.createElement('div', { 'class': 'editor-status-bar' });
    literals.view.statusBar.insertTo(literals.view.body);

    // TODO:
    literals.view.statusBar.insert('<ul><li>test</li><li>test</li><li>test</li></ul>');
  };

  // create session
  literals.f.createSession = function (opt) {
    var session = {
      id: Date.now().toString(),
      name: null,
      type: 'txt',
      content: '',
      file: {}
    };

    if (opt) {
      flagrate.extendObject(session, opt);
    }

    if (session.name === null) {
      session.name = _L('UNTITLED') + '.' + session.type;
    }

    if (literals.config[session.type]) {
      session.config = literals.config[session.type];
    } else {
      session.config = literals.config.global;
    }

    if (session.config.mode === 'plain_text') {
      session.mode = 'text';
    } else {
      session.mode = 'code';
    }

    literals.sessions.push(session);

    literals.view.tab.push({
      key: session.id,
      label: session.name,
      onSelect: function (e, tab) {
        if (literals.stat.session.id !== tab.key) {
          literals.f.selectSession(session);
        }
      }
    });

    return session;
  };

  // create session by file
  literals.f.createSessionByFile = function (file) {
    // check if a file is already open.
    var i, l;
    for (i = 0, l = literals.sessions.length; i < l; i++) {
      if (file.path === literals.sessions[i].file.path) {
        return;
      }
    }

    var session = literals.f.createSession({
      name: file.name,
      type: file.fileType.toLowerCase().replace(/^\./, ''),
      content: null,
      file: {
        path: file.path,
        token: AccessList.add(file)
      }
    });

    return session;
  };

  // select session
  literals.f.selectSession = function (session) {
    literals.f.deinitSession();

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

    literals.view.tab.select(session.id);

    return session;
  };

  // init session
  literals.f.initSession = function () {
    var session = literals.stat.session;

    // create editor
    if (session.mode === 'text') {
      literals.view.editor = CodeMirror(literals.view.editorContainer);
    }
    if (session.mode === 'code') {
      var aceElement = flagrate.createElement().insertTo(literals.view.editorContainer);
      literals.view.editor = ace.edit(aceElement);
    }

    // config
    if (session.config.theme) {
      if (session.mode === 'code') {
        literals.view.editor.setTheme('ace/theme/' + session.config.theme);
      }
    }
    if (session.config.mode) {
      if (session.mode === 'code') {
        literals.view.editor.getSession().setMode('ace/mode/' + session.config.mode);
      }
    }

    // set value (content)
    literals.view.editor.setValue(session.content);
  };

  // deinit session
  literals.f.deinitSession = function () {
    if (!literals.stat.session) {
      return;
    }

    // save content
    literals.stat.session.content = literals.view.editor.getValue();

    // TODO: save other state

    // clear editor
    literals.view.editor = null;
    literals.view.editorContainer.update();
  };

  //
  // init
  //

  // activated
  app.onactivated = function (e) {
    literals.f.init();

    if (e.detail.kind === Activation.ActivationKind.launch) {
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
