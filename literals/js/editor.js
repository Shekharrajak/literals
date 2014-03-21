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

  ace.Range = ace.require('ace/range').Range;

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
    closeBrackets: false,
    showLineNumbers: true,
    styleActiveLine: true,
    showInvisibles: true,
    wordWrap: true,
    fontSize: 12,
    lineHeight: 1.25,
    keyBinding: null,
    theme: 'xcode'
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

  // .cs config
  literals.config.cs = flagrate.extendObject({}, literals.config.global);
  literals.config.cs.mode = 'csharp';

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

    // keyboard shortcuts
    window.addEventListener('keydown', literals.f.onKeydownHandler, true);
  };

  // on keydown handler
  literals.f.onKeydownHandler = function (e) {
    if (!e.ctrlKey) {
      return;
    }

    // ctrl + tab
    if (e.ctrlKey && e.keyCode === 9) {
      var nextSessionIndex = literals.sessions.indexOf(literals.stat.session) + 1;
      if (nextSessionIndex >= literals.sessions.length) {
        literals.f.selectSession(literals.sessions[0]);
      } else {
        literals.f.selectSession(literals.sessions[nextSessionIndex]);
      }
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // ctrl + num0
    if (e.ctrlKey && (e.keyCode === 48)) {
      literals.f.selectSession(literals.sessions[literals.sessions.length - 1]);
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    // ctrl + num1 ~ num9
    if (e.ctrlKey && (e.keyCode >= 49 && e.keyCode <= 57)) {
      literals.f.selectSession(literals.sessions[e.keyCode - 49]);
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  };

  // create session
  literals.f.createSession = function (opt) {
    var session = {
      id: Date.now().toString(),
      name: null,
      type: 'txt',
      content: '',
      modified: false,
      cursors: [0, 0],// row, col
      range: {
        starts: [0, 0],// row, col
        ends: [0, 0]// row, col
      },
      scrolls: [0, 0],// x, y
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
    if (!session || literals.stat.session === session) {
      return session;
    }

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
    var config = session.config;
    
    var aceEditSession, aceSelection;

    // create editor and set value
    if (session.mode === 'text') {
      literals.view.editor = CodeMirror(literals.view.editorContainer, {
        value: session.content
      });
    }
    if (session.mode === 'code') {
      var aceElement = flagrate.createElement()
        .insertText(session.content)
        .insertTo(literals.view.editorContainer);
      literals.view.editor = ace.edit(aceElement);

      aceEditSession = literals.view.editor.getSession();
      aceSelection = literals.view.editor.getSelection();
    }

    // config
    if (session.mode === 'text') {
      literals.view.editor.setOption('tabSize', config.tabSize);
      literals.view.editor.setOption('indentWithTabs', config.useTabChar);
      literals.view.editor.setOption('lineWrapping', config.wordWrap);
      literals.view.editor.setOption('lineNumbers', config.showLineNumbers);
    }
    if (session.mode === 'code') {
      if (config.theme) {
        literals.view.editor.setTheme('ace/theme/' + config.theme);
      }
      if (config.mode) {
        aceEditSession.setMode('ace/mode/' + config.mode);
      }
      if (config.keyBinding !== null) {
        literals.view.editor.setKeyboardHandler('ace/keyboard/' + config.keyBinding);
      }

      aceEditSession.setTabSize(config.tabSize);
      aceEditSession.setUseSoftTabs(config.useTabChar === false);
      aceEditSession.setUseWrapMode(config.wordWrap);

      literals.view.editor.renderer.setShowGutter(config.showLineNumbers);

      literals.view.editor.setHighlightActiveLine(config.styleActiveLine);
      literals.view.editor.setShowInvisibles(config.showInvisibles);
      literals.view.editor.setShowPrintMargin(false);
      literals.view.editor.setBehavioursEnabled(config.closeBrackets);
    }

    // status
    if (session.mode === 'text') {
      // cursor
      literals.view.editor.setCursor(session.cursors[0], session.cursors[1]);

      // range
      if (session.range.starts !== session.range.ends) {
        literals.view.editor.setSelection(
          {
            line: session.range.starts[0],
            ch: session.range.starts[1]
          },
          {
            line: session.range.ends[0],
            ch: session.range.ends[1]
          }
        );
      }

      // scroll
      literals.view.editor.scrollTo(session.scrolls[0], session.scrolls[1]);
    }
    if (session.mode === 'code') {
      // cursor
      aceSelection.moveCursorBy(session.cursors[0], session.cursors[1])

      // range
      if (session.range.starts !== session.range.ends) {
        aceSelection.setSelectionRange(
          new ace.Range(
            session.range.starts[0], session.range.starts[1],
            session.range.ends[0], session.range.ends[1]
          )
        );
      }

      // scroll
      aceEditSession.setScrollLeft(session.scrolls[0]);
      aceEditSession.setScrollTop(session.scrolls[1]);
    }

    // focus
    literals.view.editor.focus();
  };

  // deinit session
  literals.f.deinitSession = function () {
    if (!literals.stat.session) {
      return;
    }
    var session = literals.stat.session;

    // save content
    session.content = literals.view.editor.getValue();

    // save status
    if (session.mode === 'text') {
      // cursor
      var cursor = literals.view.editor.getCursor(true);
      session.cursors = [cursor.line, cursor.ch];

      // range
      var cursorEnd = literals.view.editor.getCursor(false);
      session.range.starts = [cursor.line, cursor.ch];
      session.range.ends = [cursorEnd.line, cursorEnd.ch];

      // scroll
      var scrollInfo = literals.view.editor.getScrollInfo();
      session.scrolls = [scrollInfo.left, scrollInfo.top];
    }
    if (session.mode === 'code') {
      // cursor
      var cursorPosition = literals.view.editor.getCursorPosition();
      session.cursors = [cursorPosition.row, cursorPosition.column];

      // range
      var selectionRange = literals.view.editor.getSelectionRange();
      session.range.starts = [selectionRange.start.row, selectionRange.start.column];
      session.range.ends = [selectionRange.end.row, selectionRange.end.column];

      // scroll
      session.scrolls = [
        literals.view.editor.getSession().getScrollLeft(),
        literals.view.editor.getSession().getScrollTop()
      ];
    }

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
