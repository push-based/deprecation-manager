import https from "https";
import { promises as fs } from "fs";


export function updatePublicReleases(): Promise<any> {
  return new Promise<any>((resolve, reject) => {
    https.get("https://registry.npmjs.org/rxjs/", function(result) {
      var body = "";

      result.on("data", function(chunk) {
        body += chunk;
      });

      result.on("end", function() {
        var response = JSON.parse(body);
        // console.log("Got a response: ", response.time);
         // resolve (fs.writeFile("./output/releases.json", JSON.stringify(response.time)))
        resolve(response.time);
        // console.log("created file: ", response.time);
    });
  }).on("error", function(e) {
    console.log("Got an error: ", e);
    reject(e);
  });
}

)
;
}
