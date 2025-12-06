import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("room/:id", "routes/room.$id.tsx"),
] satisfies RouteConfig;
