export class ProjectNotFoundError extends Error {
  constructor(message?: string) {
      super(message);
      
      Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
      this.name = ProjectNotFoundError.name; // stack traces display correctly now 
  }
}