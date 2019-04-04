const q = require('daskeyboard-applet');

const logger = q.logger;
const queryUrlBase = 'https://3.basecampapi.com';

class Basecamp extends q.DesktopApp {
  constructor() {
    super();
    // run every mintutes
    this.pollingInterval = 60 * 1000;
  }

  async applyConfig() {
    logger.info("applyCongig() Basecamp3.");

    // Array to keep in mind the projects name and update date.
    this.updated_at = {};

    // User ID
    this.userId = this.config.userId;

    // Only if userId is definded
    if(this.userId){

      // first get all the user projects
      return this.getAllProjects().then((projects) => {

        logger.info("Let's configure the project table by getting the time.");

        for (let project of projects) {
          // Get update_at for each project
          this.updated_at[project.name] = project.updated_at;
        }

      })
      .catch(error => {
        logger.error(
          `Got error sending request to service: ${JSON.stringify(error)}`);
        return q.Signal.error([
          'The Basecamp service returned an error. Please check your user ID and account.',
          `Detail: ${error.message}`]);
      });

    }else{
      logger.info("UserId is not defined.");
    }

  }

  // Get all the user projects
  async getAllProjects() {
    const query = `/${this.userId}/projects.json`;
    const proxyRequest = new q.Oauth2ProxyRequest({
      apiKey: this.authorization.apiKey,
      uri: queryUrlBase + query
    });
    return this.oauth2ProxyRequest(proxyRequest);
  }

  async run() {
    logger.info("Running Basecamp3.");
    return this.getAllProjects().then(projects => {
      let triggered = false;
      let message = [];
      this.url = "";
      var notification = 0;

      for (let project of projects) {

        if(project.updated_at > this.updated_at[project.name]){

          // Need to send a signal         
          triggered=true;
          logger.info("Got an update in:" + project.name);

          // Need to update the time of the project which got an update
          this.updated_at[project.name] = project.updated_at;

          // Update signal's message
          message.push(`New update in ${project.name}.`);

          // Update url:
          // if there are several notifications on different projects:
          // the url needs to redirect on the projects page
          if(notification >= 1){
            this.url = `https://3.basecamp.com/${this.userId}/projects/`;
          }else{
            this.url = project.app_url;
          }
          notification = notification +1;

        }

      }

      if (triggered) {
        return new q.Signal({
          points: [
            [new q.Point(this.config.color, this.config.effect)]
          ],
          name: `Basecamp`,
          message: message.join("<br>"),
          link: {
            url: this.url,
            label: 'Show in Basecamp',
          },
        });
      } else {
        logger.info("None udpate received.");
        return null;
      }
    }).catch(error => {
      logger.error(
        `Got error sending request to service: ${JSON.stringify(error)}`);
      return q.Signal.error([
        'The Basecamp service returned an error. Please check your user ID and account.',
        `Detail: ${error.message}`]);
    });
  }
}


module.exports = {
  Basecamp: Basecamp
}

const applet = new Basecamp();