import { print } from "graphql";

export default function visit() {
	return {
		Directive(node, _key, _parent, _path, ancestors) {
			if (node.name.value !== "auth") return;

			const target = ancestors.at(-1);
			if (
				target.kind === "FieldDefinition" &&
				target.type.kind === "NonNullType"
			) {
				console.error(
					`@auth can not be used with non-nullable types, found "${print(
						target.type,
					)}"`,
				);
			}
		},
	};
}
