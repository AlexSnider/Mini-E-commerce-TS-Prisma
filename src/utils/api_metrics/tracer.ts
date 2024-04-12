import * as opentelemetry from "@opentelemetry/sdk-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { WinstonInstrumentation } from "@opentelemetry/instrumentation-winston";

const sdk = new opentelemetry.NodeSDK({
  serviceName: "Mini E-Commerce - Traces",
  traceExporter: new OTLPTraceExporter({
    url: "http://localhost:4318/v1/traces",
    headers: {},
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: "http://localhost:4318/v1/metrics",
      headers: {},
    }),
  }),
  instrumentations: [getNodeAutoInstrumentations(), new WinstonInstrumentation()],
});

try {
  sdk.start();
  console.log("Tracer started successfully.");
} catch (error) {
  console.log("Tracer failed to start:", error);
}
