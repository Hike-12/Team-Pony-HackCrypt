import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Settings2, Sparkles, Zap } from 'lucide-react'

export default function Features() {
    return (
        <section className="bg-transparent py-16 md:py-32 lg:py-32 dark:bg-transparent">
            <div className="@container mx-auto max-w-5xl px-6">
                <div className="text-center">
                    <h2 className="text-balance text-4xl font-semibold lg:text-5xl">Comprehensive Feature Set</h2>
                    <p className="mt-4">From multi-factor authentication to advanced analytics, we cover every aspect of secure attendance.</p>
                </div>
                <Card
                    className="@min-4xl:max-w-full @min-4xl:grid-cols-3 @min-4xl:divide-x @min-4xl:divide-y-0 mx-auto mt-8 grid max-w-sm divide-y overflow-hidden shadow-zinc-950/5 *:text-center md:mt-16">
                    <div className="group shadow-zinc-950/5">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Settings2 className="size-6" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium">Admin Dashboard</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="text-sm">Includes attendance analytics, anomaly detection (e.g., repeated failed attempts), and generating reports for faculty.</p>
                        </CardContent>
                    </div>

                    <div className="group shadow-zinc-950/5">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Zap className="size-6" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium">Teacher Portal</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="mt-3 text-sm">Seamless integration with classroom or lab sessions, supporting both facial and fingerprint workflows.</p>
                        </CardContent>
                    </div>

                    <div className="group shadow-zinc-950/5">
                        <CardHeader className="pb-3">
                            <CardDecorator>
                                <Sparkles className="size-6" aria-hidden />
                            </CardDecorator>

                            <h3 className="mt-6 font-medium">Student Access</h3>
                        </CardHeader>

                        <CardContent>
                            <p className="mt-3 text-sm">Simulate biometric workflows without real hardware, ensuring privacy awareness and reliability.</p>
                        </CardContent>
                    </div>
                </Card>
            </div>
        </section>
    );
}

const CardDecorator = ({
    children
}) => (
    <div
        className="mask-radial-from-40% mask-radial-to-60% relative mx-auto size-36 duration-200 [--color-border:color-mix(in_oklab,var(--color-zinc-950)10%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-zinc-950)20%,transparent)] dark:[--color-border:color-mix(in_oklab,var(--color-white)15%,transparent)] dark:group-hover:[--color-border:color-mix(in_oklab,var(--color-white)20%,transparent)]">
        <div
            aria-hidden
            className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-size-[24px_24px] dark:opacity-50" />

        <div
            className="bg-background absolute inset-0 m-auto flex size-12 items-center justify-center border-l border-t">{children}</div>
    </div>
)

