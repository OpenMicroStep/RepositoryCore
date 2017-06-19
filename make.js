module.exports =  {
  is: "project",
  name: "Repository",
  workspace: "logitud.repository",
  "files=": { is: 'group', elements: [
      { is: 'group', name: 'app', path: 'app/src/', elements: [
        { is: 'file', name: 'main.ts', tags: ['tsc'] },
        { is: 'file', name: 'index.html', tags: ['copy'] },
        { is: 'file', name: 'styles.css', tags: ['copy'] },
        { is: 'file', name: 'systemjs.config.js', tags: ['copy'] },
        { is: 'file', name: 'images/*.png', tags: ['copy'] },
      ]},
      { is: 'group', name: 'server', path: 'server/src/', elements: [
        { is: 'file', name: 'server.ts', tags: ['tsc']},
      ]},
      { is: 'group', name: 'shared', path: 'shared/src/', elements: [
        { is: 'file', name: 'interfaces.md', tags: ['interface']},
      ]},
  ]},
  "targets=": { is: 'group',
    "repository app=":  {
      is: 'target',
      environments: ["=::openms.aspects.angular::"],
      components: ["=::openms.aspects.angular.dev::"],
      files: ["=files:app ? tsc", "=files:shared ? tsc"],
      copyFiles: [{ is: "group", elements: ["=files:app ? copy"], dest: "", expand: true }],
      interfaces: [{ is: "group", elements: ['=files:shared ? interface'] }],
      npmPackage: { is: "component",
        dependencies: { is: "component",
          "@angular/material" : "2.0.0-beta.6"
        }
      },
    },
    "repository server=":  {
      is: 'target',
      environments: ["=::openms.aspects.node::"],
      components: ["=::openms.aspects.node.dev::", "=::aspects obi::"],
      targets: ["aspects obi"],
      files: ["=files:server ? tsc", "=files:shared ? tsc"],
      interfaces: [{ is: "group", elements: ['=files:shared ? interface'] }],
      npmPackage: { is: "component",
        dependencies: { is: "component",
          "sqlite3": "^3.1.8",
          "@openmicrostep/msbuildsystem.shared": "^0.5.6",
          "express-session": "^1.15.0",
          "ldapjs": "^1.0.1",
        },
        devDependencies: { is: "component",
          "@types/ldapjs": "^1.0.0"
        },
      },
    }
  }
};
