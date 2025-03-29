<img src="https://raw.githubusercontent.com/sehnsucht-nach-einer-ehefrau/senku/main/senku.png" width="330"/></img>

# SENKU

## An AI powered Personal Library

### USE

- This is for my own personal use, but you can download the source code and run it yourself with your own environment variables.

.env.local should contain: 

```
GROQ_API_KEY=<your groq api key>
SPREADSHEET_ID=<your google spreadsheet id>
GOOGLE_CLIENT_EMAIL=<your google client email>
GOOGLE_PRIVATE_KEY=<your google private key>
GOOGLE_PROJECT_ID=<your google project id>
APP_PASSWORD=<your own custom password>
JWT_SECRET=<used to sign JWT tokens, a 32 character secure random string>
```

- The spreadsheet ID is the part of the URL that looks like this: `https://docs.google.com/spreadsheets/d/<spreadsheet_id>/edit#gid=0` (you make the spreadsheet manually, and then you can use the ID from the URL).

- For the Google environment variables, you must go to [Google Cloud Console](https://console.cloud.google.com/) and create a new project. Then, enable the Google Sheets API and create a service account. Download the JSON file and copy the values into your .env.local file.
- Don't forget to share the spreadsheet with the service account email (found in the JSON file) so that it can access the spreadsheet.

- Make the app password whatever you want as your password for the app.
- Make the JWT secret a secure random string, 32 characters MINIMUM(for security). You can just go to random string generators online and generate one, and maybe put a bunch of your own symbols and whatever in there just for good measure.

### Future plans

- [ ] Fix bugs?
