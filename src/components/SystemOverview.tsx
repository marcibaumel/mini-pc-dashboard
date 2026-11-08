import type { SystemInfo } from "@/types/storage";
import { formatUptime } from "@/lib/format";
import { SummaryCard } from "@/components/ui";

export function SystemOverview({ system }: { system: SystemInfo }) {
    const projectHost = system.networkAddresses.find(
        (address) => address.family === "IPv4",
    )?.address;

    return (
        <section className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <SummaryCard
                    label="Uptime"
                    value={formatUptime(system.uptimeSeconds)}
                />
                <SummaryCard
                    label="IP addresses"
                    value={String(system.networkAddresses.length)}
                    hint="Non-local interfaces"
                />
                <SummaryCard
                    label="Running services"
                    value={
                        system.servicesAvailable
                            ? String(system.services.length)
                            : "Unavailable"
                    }
                    hint={
                        system.servicesAvailable
                            ? "systemd units"
                            : "systemd not available"
                    }
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Network addresses
                    </h2>
                    {system.networkAddresses.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            No non-local addresses detected.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {system.networkAddresses.map((address) => (
                                <div
                                    key={`${address.interface}-${address.address}`}
                                    className="flex items-center justify-between gap-3 text-sm"
                                >
                                    <span className="truncate text-slate-500 dark:text-slate-400">
                                        {address.interface}
                                    </span>
                                    <span className="truncate font-mono text-slate-900 dark:text-slate-100">
                                        {address.address}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Running services
                    </h2>
                    {!system.servicesAvailable ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Service information is unavailable on this host.
                        </p>
                    ) : system.services.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            No running services detected.
                        </p>
                    ) : (
                        <div className="grid max-h-64 gap-x-4 gap-y-2 overflow-y-auto sm:grid-cols-2">
                            {system.services.map((service) => (
                                <div key={service.name} className="min-w-0">
                                    <p className="truncate font-mono text-sm text-slate-900 dark:text-slate-100">
                                        {service.name}
                                    </p>
                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                        {service.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2 dark:border-slate-700 dark:bg-slate-800">
                    <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            Running projects
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Listening on ports 3000–3099
                        </p>
                    </div>
                    {!system.projectsAvailable ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Project information is unavailable on this host.
                        </p>
                    ) : system.projects.length === 0 ? (
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            No running projects detected.
                        </p>
                    ) : (
                        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                            {system.projects.map((project) => (
                                <div
                                    key={`${project.port}-${project.pid ?? project.process}`}
                                    className="min-w-0"
                                >
                                    {projectHost ? (
                                        <a
                                            href={`http://${projectHost}:${project.port}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="truncate font-medium text-slate-900 hover:text-blue-600 hover:underline dark:text-slate-100 dark:hover:text-blue-400"
                                        >
                                            {project.name}
                                        </a>
                                    ) : (
                                        <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                                            {project.name}
                                        </p>
                                    )}
                                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                                        Port {project.port}
                                        {project.pid !== null &&
                                            ` · PID ${project.pid}`}
                                        {` · ${project.process}`}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
