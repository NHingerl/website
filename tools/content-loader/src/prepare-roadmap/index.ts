import { resolve } from "path";
import to from "await-to-js";

import { CoreConfig, PrepareFor } from "../config";
import roadmapConfig from "./config";

import CapabilitiesFetcher from "./capabilities-fetcher";
import TicketsFetcher from "./tickets-fetcher";
import TicketsExtractor from "./tickets-extractor";

import { Capability, Repository, Tickets } from "./types";

const prepareRoadmapContent = async (coreConfig: CoreConfig) => {
  const capabilitiesDir = resolve(
    `${roadmapConfig.tempPath}/${roadmapConfig.capabilitiesDir}`,
  );
  const capabilitiesOutput = resolve(roadmapConfig.capabilitiesOutput);
  const ticketsOutput = resolve(roadmapConfig.ticketsOutput);

  let err: Error | null = null;

  [err] = await to(CapabilitiesFetcher.copyCommunityRepository(coreConfig));
  if (err) {
    throw err;
  }

  [err] = await to(
    CapabilitiesFetcher.copyCapabilities(capabilitiesDir, capabilitiesOutput),
  );
  if (err) {
    throw err;
  }

  console.log(`Extracting metadata of capabilities`);
  let capabilities: Capability[];
  [err, capabilities] = await to(
    CapabilitiesFetcher.extractCapabilitiesMetadata(capabilitiesDir),
  );
  if (err) throw err;

  console.log(`Querying for repositories of ${coreConfig.organization}`);
  let repositories: Repository[];
  [err, repositories] = await to(TicketsFetcher.queryRepositories());
  if (err) {
    throw err;
  }

  console.log(`Querying for milestones`);
  let milestoneTitlesSet: Set<string>;
  [err, milestoneTitlesSet] = await to(
    TicketsFetcher.getMilestoneTitles(repositories),
  );
  if (err) throw err;

  console.log(`Querying for issues with Epic label`);
  let repositoriesWithEpics: Repository[];
  [err, repositoriesWithEpics] = await to(
    TicketsFetcher.queryEpics(repositories),
  );
  if (err) {
    throw err;
  }

  console.log(`Generating tickets`);
  const tickets: Tickets = TicketsExtractor.extractTickets({
    repositoriesWithEpics,
    milestoneTitlesSet,
    capabilities,
  });

  console.log(`Writing tickets to ${ticketsOutput}`);
  [err] = await to(TicketsExtractor.writeTickets(ticketsOutput, tickets));
  if (err) {
    throw err;
  }
};

export default async (coreConfig: CoreConfig) => {
  // if (coreConfig.prepareFor === PrepareFor.WEBSITE) {
  //   return prepareRoadmapContent(coreConfig);
  // }
  // if (coreConfig.prepareFor === PrepareFor.COMMUNITY_PREVIEW) {
  //   return undefined;
  // }
  return;
};
