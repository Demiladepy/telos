import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),
  route("marketplace", "routes/marketplace.tsx"),
  route("marketplace/:agentId", "routes/marketplace.$agentId.tsx"),
  route("dashboard", "routes/dashboard.tsx", [
    index("routes/dashboard._index.tsx"),
    route("agents", "routes/dashboard.agents.tsx"),
    route("transactions", "routes/dashboard.transactions.tsx"),
    route("settings", "routes/dashboard.settings.tsx"),
  ]),
  route("deploy", "routes/deploy.tsx"),
  route("network", "routes/network.tsx"),
  route("about", "routes/about.tsx"),
] satisfies RouteConfig;
