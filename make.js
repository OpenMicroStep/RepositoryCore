module.exports =  {
  is: "project",
  name: "Repository",
  workspace: "logitud.repository",
  "files=": { is: 'group', elements: [
      { is: 'group', name: 'app', path: 'app/', elements: [
      ]},
      { is: 'group', name: 'server', path: 'server/src/', elements: [
        { is: 'file', name: 'server.ts', tags: ['tsc']},
      ]},
      { is: 'group', name: 'shared', path: 'shared/', elements: [
      ]},
  ]},
  "targets=": { is: 'group',
    /*"repository app=":  {
      is: 'target',
      environments: ["=::openms.aspects.angular::"],
      components: ["=::openms.aspects.angular.dev::"],
      files: ["=files:app ? tsc", "=files:shared ? tsc"],
      copyFiles: [{ is: "group", elements: ["=files:app ? copy"], dest: "" }],
      interfaces: [{ is: "group", elements: ['=files:shared ? interface'], header: `import {DataSource} from '@openmicrostep/aspects';` }]
    },*/
    "repository server=":  {
      is: 'target',
      environments: ["=::openms.aspects.node::"],
      components: ["=::openms.aspects.node.dev::", "=::aspects obi::"],
      targets: ["aspects obi"],
      files: ["=files:server ? tsc", "=files:shared ? tsc"],
      //interfaces: [{ is: "group", elements: ['=files:shared ? interface'], header: `import {DataSource} from '@openmicrostep/aspects';` }],
      npmPackage: { is: "component",
        dependencies: { is: "component",
          "sqlite3": "^3.1.8",
          "@openmicrostep/msbuildsystem.shared": "^0.5.0",
          "express-session": "^1.15.0",
        }
      },
    }
  }
};
