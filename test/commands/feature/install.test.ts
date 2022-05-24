import {expect, test} from '@oclif/test'
import { Project } from '../../../src/lib/Project';
import { ProjectManager } from '../../../src/lib/ProjectManager';

describe('xcl feature install', () => {
   test
   .it('single mode project has just one entry in user array', ctx => {
      let project:Project = ProjectManager.getInstance().getProject('cloudutil');
      expect(project.getUserNames().length).equals(1);
   });

   test
   .it('single mode project has just one entry in user map', ctx => {
      let project:Project = ProjectManager.getInstance().getProject('cloudutil');
      expect(project.getUsers().size).equals(1);
   });

   test
   .it('multi mode project has three entries in user map', ctx => {
      let project:Project = ProjectManager.getInstance().getProject('administration');
      expect(project.getUsers().size).equals(3);
   });
   
});
