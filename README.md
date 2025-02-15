# comp-7082-group-4

## Adding a new ADDON to the project

Steps to add a new addon to the project:

### Frontend
1. Create a new folder in the addons folder with the name of the addon.

2. Create a new file that will hold the controller class for the addon. This class should implement the AddonControlInterface.

3. Create a folder in the addon's folder for the addon's Modal Component. This component should be a React component that will be displayed in a modal when the addon is clicked.

4. Edit config.ts to add your addon to the list of addons

5. Edit the AddonManager Component's getAddonComponent method to return the Modal Component for your addon.

6. Edit the constructor of the AddonManagerController to create an instance of your addon's controller class and add it to the list of controllers.
