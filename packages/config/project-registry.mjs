import {
  mobileNavConfigs,
  resolveMobileNavItems,
} from "./app-shell/mobile-nav.mjs";

export const projectContentStatusLabels = {
  current: "已复核",
  "review-required": "待复核",
  "reference-only": "参考资料",
};

export const cloudflareBasePathKeys = {
  fms: "fmsBase",
  "heat-stroke": "heatStrokeBase",
  tccc: "tcccBase",
};

export const staticProjectContentGovernanceKeys = {
  "heat-stroke": "heatStroke",
  tccc: "tccc",
};

export const siteRepresentativeRoutes = ["/", "/blog", "/offline"];

export const representativeProjectRouteSuffixes = {
  fms: ["assessment", "history", "report", "training", "education", "about"],
  "heat-stroke": [
    "pages/field-treatment",
    "pages/heat-index",
    "pages/8-4-6-rule",
    "pages/diagnosis-treatment-guideline",
    "pages/treatment-system-consensus",
    "pages/about",
  ],
  tccc: [
    "pages/tccc-standard",
    "pages/tfc-airway",
    "pages/tccc-flow-framework",
  ],
};

export const projectRuntimeContracts = {
  fms: {
    runtime: "vite-react",
    routeOwner: "cloudflare-build",
    nextMigrationStage: "vite-owned-next-app-deferred",
    migrationRisk: "high",
  },
  "heat-stroke": {
    runtime: "static-html-tailwind",
    routeOwner: "next",
    nextMigrationStage:
      "next-home-about-rule-guide-and-consensus-owned-static-deep-pages-pending",
    migrationRisk: "medium",
  },
  tccc: {
    runtime: "static-html-tailwind",
    routeOwner: "next",
    nextMigrationStage: "next-home-owned-static-deep-pages-pending",
    migrationRisk: "medium",
  },
};

export function normalizeBasePath(basePath) {
  if (!basePath || basePath === "/") {
    return "/";
  }

  let normalized = basePath.startsWith("/") ? basePath : `/${basePath}`;
  normalized = normalized.endsWith("/") ? normalized : `${normalized}/`;
  return normalized;
}

export function normalizeProjectBasePath(value, projectId) {
  if (typeof value !== "string" || !value.startsWith("/")) {
    throw new Error(
      `Integrated project ${projectId} must use a root-relative href`,
    );
  }

  const normalized = normalizeBasePath(value);

  if (!/^\/[a-z0-9-]+\/$/.test(normalized)) {
    throw new Error(
      `Integrated project ${projectId} has unsupported base path ${value}`,
    );
  }

  return normalized;
}

export function joinProjectRoute(basePath, suffix) {
  return `${basePath}${suffix.replace(/^\/+/, "")}`;
}

export function getRegistryProject(registry, id) {
  const project = registry.platformProjects.find((entry) => entry.id === id);

  if (!project) {
    throw new Error(`Missing project registry entry for ${id}`);
  }

  return project;
}

export function buildContentGovernanceFromRegistry(project) {
  if (!project?.content) {
    throw new Error(`Missing content governance metadata for ${project?.id}`);
  }

  const statusLabel = projectContentStatusLabels[project.content.status];
  if (!statusLabel) {
    throw new Error(
      `Unsupported content status ${project.content.status} for ${project.id}`,
    );
  }

  return {
    label: project.shortTitle,
    sourceName: project.content.sourceName,
    version: project.content.version,
    reviewedAt: project.content.reviewedAt,
    statusLabel,
    disclaimer: project.content.disclaimer,
    officialUpdateUrl: project.content.officialUpdateUrl,
  };
}

export function buildStaticProjectContentGovernanceFromRegistry(
  registry,
  projectKeyMap = staticProjectContentGovernanceKeys,
) {
  return Object.fromEntries(
    Object.entries(projectKeyMap).map(([projectId, governanceKey]) => [
      governanceKey,
      buildContentGovernanceFromRegistry(
        getRegistryProject(registry, projectId),
      ),
    ]),
  );
}

export function buildCloudflareBasePathsFromRegistry(
  registry,
  pathKeys = cloudflareBasePathKeys,
) {
  const basePaths = {};
  const integratedProjects = registry.platformProjects.filter(
    (project) => project.status === "integrated",
  );

  for (const project of integratedProjects) {
    const key = pathKeys[project.id];

    if (!key) {
      throw new Error(
        `Integrated project ${project.id} must be mapped in @hongyishi/config/project-registry`,
      );
    }

    basePaths[key] = normalizeProjectBasePath(project.href, project.id);
  }

  for (const key of Object.values(pathKeys)) {
    if (!basePaths[key]) {
      throw new Error(`Missing Cloudflare base path ${key}`);
    }
  }

  return basePaths;
}

export function buildProjectRuntimeContractsFromRegistry(
  registry,
  runtimeContracts = projectRuntimeContracts,
) {
  return registry.platformProjects
    .filter((project) => project.status === "integrated")
    .map((project) => {
      const contract = runtimeContracts[project.id];

      if (!contract) {
        throw new Error(
          `Integrated project ${project.id} must define runtime ownership in @hongyishi/config/project-registry`,
        );
      }

      return {
        id: project.id,
        href: normalizeProjectBasePath(project.href, project.id),
        ...contract,
      };
    });
}

export function buildRepresentativeRoutesFromRegistry(
  registry,
  siteRoutes = siteRepresentativeRoutes,
) {
  const routes = [...siteRoutes];
  const integratedProjects = registry.platformProjects.filter(
    (project) => project.status === "integrated",
  );

  for (const project of integratedProjects) {
    const suffixes = representativeProjectRouteSuffixes[project.id];

    if (!suffixes) {
      throw new Error(
        `Integrated project ${project.id} must define representative audit routes in @hongyishi/config/project-registry`,
      );
    }

    const basePath = normalizeProjectBasePath(project.href, project.id);
    routes.push(basePath);

    for (const suffix of suffixes) {
      routes.push(joinProjectRoute(basePath, suffix));
    }
  }

  return [...new Set(routes)];
}

function buildStaticProjectMobileNavExpectation({
  expectedScope,
  linkBase,
  path,
}) {
  const bottomTabs = resolveMobileNavItems(expectedScope, linkBase);
  const menuTabs = resolveMobileNavItems(expectedScope, linkBase, {
    surface: "menu",
  });

  return {
    path,
    expectedScope,
    linkBase,
    requiredHrefs: bottomTabs.map((tab) => tab.href),
    expectedTopMenuHrefs: menuTabs.map((tab) => tab.href),
    expectedTopMenuLabels: menuTabs.map((tab) => tab.label),
  };
}

export function buildMobileNavAuditExpectations(registry) {
  const fmsBase = normalizeProjectBasePath(
    getRegistryProject(registry, "fms").href,
    "fms",
  );
  const heatStrokeBase = normalizeProjectBasePath(
    getRegistryProject(registry, "heat-stroke").href,
    "heat-stroke",
  );
  const tcccBase = normalizeProjectBasePath(
    getRegistryProject(registry, "tccc").href,
    "tccc",
  );

  return [
    {
      path: "/",
      requiredLabels: mobileNavConfigs.platform.tabs.map((tab) => tab.label),
    },
    buildStaticProjectMobileNavExpectation({
      path: heatStrokeBase,
      expectedScope: "heatStroke",
      linkBase: heatStrokeBase,
    }),
    buildStaticProjectMobileNavExpectation({
      path: joinProjectRoute(heatStrokeBase, "pages/field-treatment"),
      expectedScope: "heatStroke",
      linkBase: heatStrokeBase,
    }),
    buildStaticProjectMobileNavExpectation({
      path: tcccBase,
      expectedScope: "tccc",
      linkBase: tcccBase,
    }),
    buildStaticProjectMobileNavExpectation({
      path: joinProjectRoute(tcccBase, "pages/tccc-standard"),
      expectedScope: "tccc",
      linkBase: tcccBase,
    }),
    {
      path: joinProjectRoute(fmsBase, "assessment"),
      expectedScope: "fms",
      linkBase: fmsBase,
      requiredHrefs: [
        fmsBase.replace(/\/$/, ""),
        joinProjectRoute(fmsBase, "assessment"),
        joinProjectRoute(fmsBase, "training"),
        joinProjectRoute(fmsBase, "history"),
      ],
    },
  ];
}
