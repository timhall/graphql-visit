#!/usr/bin/env node

import { run } from "@timhall/cli";
import { TypeInfo, parse, visit, visitWithTypeInfo } from "graphql";
import { loadConfig } from "graphql-config";
import mri from "mri";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const help = `Usage: graphql-visit [options] <visitor.js> [<file.graphql>...]

Arguments:
  visitor.js    Path to visitor object or function
  file.graphql  Path to graphql document to visit (default: documents from graphql-config)

Options:
  -h --help  Show usage information
`;

run("graphql-visit", async () => {
	const args = mri(process.argv.slice(2), {
		alias: { h: "help" },
	});
	const [visitorPath, ...relativePaths] = args._;
	const paths = relativePaths.map((relativePath) => resolve(relativePath));

	if (args.help) {
		console.log(help);
		return;
	}

	let visitor;
	try {
		const visitorModule = await import(join(process.cwd(), visitorPath));
		visitor =
			"default" in visitorModule ? visitorModule.default : visitorModule;
	} catch (error) {
		throw new Error();
	}

	let project;
	try {
		const config = await loadConfig();
		project = config.getDefault();
	} catch (error) {
		throw new Error(
			`Unable to load GraphQL project from graphql-config. ${error}`,
		);
	}

	const loadingDocuments = paths.length
		? Promise.all(paths.map(loadSource))
		: project.getDocuments();

	const [schema, documents] = await Promise.all([
		project.getSchema(),
		loadingDocuments,
	]);

	const typeInfo = new TypeInfo(schema);
	if (typeof visitor === "function") {
		visitor = visitor(typeInfo);
	}

	for (const { location, document } of documents) {
		console.log(`Visiting "${location}"`);
		visit(document, visitWithTypeInfo(typeInfo, visitor));
	}
});

async function loadSource(location) {
	const rawSDL = await readFile(location, "utf-8");
	const document = parse(rawSDL);

	return { location, rawSDL, document };
}
