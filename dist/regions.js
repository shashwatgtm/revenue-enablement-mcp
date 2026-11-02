"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REGION_GENERATION = exports.REGION_TAXONOMY = exports.REGION_SOURCES = exports.REGION_DATA = exports.REGION_CHOICES = void 0;
exports.REGION_CHOICES = [
    {
        "id": "india",
        "name": "India"
    },
    {
        "id": "southeast-asia",
        "name": "Southeast Asia"
    },
    {
        "id": "middle-east",
        "name": "Middle East"
    },
    {
        "id": "uk",
        "name": "UK"
    },
    {
        "id": "western-europe",
        "name": "Western Europe"
    },
    {
        "id": "north-america",
        "name": "North America"
    }
];
exports.REGION_DATA = [];
exports.REGION_SOURCES = {};
exports.REGION_TAXONOMY = {
    "schema_version": "1.0.0",
    "source_repository": "shashwatgtm/icp-intelligence-mcp",
    "source_commit": "01998942dbda8d265f1c951c0b926bc044da9b4c",
    "requested_subtype_count": 48,
    "observed_subtype_count": 57,
    "verticals": [
        {
            "id": "logistics-tech",
            "name": "logistics tech"
        },
        {
            "id": "fintech",
            "name": "fintech"
        },
        {
            "id": "vertical-saas",
            "name": "vertical SaaS"
        },
        {
            "id": "ai-native",
            "name": "AI native"
        },
        {
            "id": "ites",
            "name": "ITeS"
        },
        {
            "id": "telecom",
            "name": "telecom"
        },
        {
            "id": "cybersecurity",
            "name": "cybersecurity"
        },
        {
            "id": "software",
            "name": "software"
        },
        {
            "id": "saas",
            "name": "SaaS"
        }
    ],
    "subtypes": [
        {
            "id": "freight-visibility",
            "vertical_id": "logistics-tech",
            "name": "freight visibility"
        },
        {
            "id": "freight-marketplace",
            "vertical_id": "logistics-tech",
            "name": "freight marketplaces"
        },
        {
            "id": "seller-shipping",
            "vertical_id": "logistics-tech",
            "name": "shipping for online sellers"
        },
        {
            "id": "last-mile",
            "vertical_id": "logistics-tech",
            "name": "last mile delivery"
        },
        {
            "id": "warehousing",
            "vertical_id": "logistics-tech",
            "name": "warehousing and fulfilment"
        },
        {
            "id": "transport-management",
            "vertical_id": "logistics-tech",
            "name": "transport and fleet management"
        },
        {
            "id": "payments-banking",
            "vertical_id": "fintech",
            "name": "payments and banking APIs"
        },
        {
            "id": "core-banking",
            "vertical_id": "fintech",
            "name": "core banking and lending platforms"
        },
        {
            "id": "lending",
            "vertical_id": "fintech",
            "name": "lending and credit data"
        },
        {
            "id": "wealth-investment",
            "vertical_id": "fintech",
            "name": "wealth and investment"
        },
        {
            "id": "spend-expense",
            "vertical_id": "fintech",
            "name": "spend and expense"
        },
        {
            "id": "insurance",
            "vertical_id": "fintech",
            "name": "insurance"
        },
        {
            "id": "customer-service",
            "vertical_id": "saas",
            "name": "customer service software"
        },
        {
            "id": "crm-marketing",
            "vertical_id": "saas",
            "name": "CRM and marketing"
        },
        {
            "id": "collaboration",
            "vertical_id": "saas",
            "name": "collaboration and work management"
        },
        {
            "id": "product-growth",
            "vertical_id": "saas",
            "name": "product analytics and customer success"
        },
        {
            "id": "construction",
            "vertical_id": "vertical-saas",
            "name": "construction management"
        },
        {
            "id": "property-management",
            "vertical_id": "vertical-saas",
            "name": "property management"
        },
        {
            "id": "field-services",
            "vertical_id": "vertical-saas",
            "name": "field and home services"
        },
        {
            "id": "fmcg-retail-execution",
            "vertical_id": "vertical-saas",
            "name": "FMCG retail execution"
        },
        {
            "id": "industry-hr-payroll",
            "vertical_id": "vertical-saas",
            "name": "HR and payroll built for one industry"
        },
        {
            "id": "hotel-lodging",
            "vertical_id": "vertical-saas",
            "name": "hotels and lodging operations"
        },
        {
            "id": "retail-restaurant-ops",
            "vertical_id": "vertical-saas",
            "name": "retail, restaurant and distribution operations"
        },
        {
            "id": "agents-copilots",
            "vertical_id": "ai-native",
            "name": "AI agents and copilots for a business function"
        },
        {
            "id": "voice-language-models",
            "vertical_id": "ai-native",
            "name": "voice and language models"
        },
        {
            "id": "enterprise-search",
            "vertical_id": "ai-native",
            "name": "enterprise search and work assistants"
        },
        {
            "id": "it-services",
            "vertical_id": "ites",
            "name": "IT services and application services"
        },
        {
            "id": "bpo-cx",
            "vertical_id": "ites",
            "name": "BPO and customer experience outsourcing"
        },
        {
            "id": "digital-engineering",
            "vertical_id": "ites",
            "name": "digital engineering and product engineering"
        },
        {
            "id": "data-services",
            "vertical_id": "ites",
            "name": "data and analytics services"
        },
        {
            "id": "operators-connectivity",
            "vertical_id": "telecom",
            "name": "operators and enterprise connectivity"
        },
        {
            "id": "cpaas-messaging",
            "vertical_id": "telecom",
            "name": "CPaaS and messaging"
        },
        {
            "id": "telecom-software",
            "vertical_id": "telecom",
            "name": "software and clearing services sold to operators"
        },
        {
            "id": "business-voice-ucaas",
            "vertical_id": "telecom",
            "name": "business voice and unified communications"
        },
        {
            "id": "developer-platform",
            "vertical_id": "software",
            "name": "developer platforms and DevOps"
        },
        {
            "id": "data-infrastructure",
            "vertical_id": "software",
            "name": "managed data infrastructure"
        },
        {
            "id": "observability",
            "vertical_id": "software",
            "name": "observability and application monitoring"
        },
        {
            "id": "testing",
            "vertical_id": "software",
            "name": "testing and QA tools"
        },
        {
            "id": "dev-tools",
            "vertical_id": "software",
            "name": "containers and developer environments"
        },
        {
            "id": "cloud-security",
            "vertical_id": "cybersecurity",
            "name": "cloud security"
        },
        {
            "id": "identity-security",
            "vertical_id": "cybersecurity",
            "name": "identity and access"
        },
        {
            "id": "email-security",
            "vertical_id": "cybersecurity",
            "name": "email security"
        },
        {
            "id": "awareness-training",
            "vertical_id": "cybersecurity",
            "name": "security awareness and human risk"
        },
        {
            "id": "appsec",
            "vertical_id": "cybersecurity",
            "name": "application and developer security"
        },
        {
            "id": "mobile-appsec",
            "vertical_id": "cybersecurity",
            "name": "mobile application security"
        },
        {
            "id": "soc-services",
            "vertical_id": "cybersecurity",
            "name": "managed detection and SOC services"
        },
        {
            "id": "endpoint-network",
            "vertical_id": "cybersecurity",
            "name": "endpoint and network security"
        },
        {
            "id": "document-ai",
            "vertical_id": "ai-native",
            "name": "document AI and intelligent document processing"
        },
        {
            "id": "ai-video",
            "vertical_id": "ai-native",
            "name": "AI video for training and communications"
        },
        {
            "id": "engineering-talent",
            "vertical_id": "ites",
            "name": "engineering talent and team augmentation"
        },
        {
            "id": "product-management",
            "vertical_id": "saas",
            "name": "product management software"
        },
        {
            "id": "digital-adoption",
            "vertical_id": "saas",
            "name": "digital adoption platforms"
        },
        {
            "id": "pentest",
            "vertical_id": "cybersecurity",
            "name": "penetration testing and offensive security"
        },
        {
            "id": "attack-surface-dast",
            "vertical_id": "cybersecurity",
            "name": "external attack surface and dynamic testing"
        },
        {
            "id": "process-orchestration",
            "vertical_id": "software",
            "name": "process orchestration and workflow engines"
        },
        {
            "id": "open-source-support",
            "vertical_id": "software",
            "name": "open source software support and services"
        },
        {
            "id": "iot-connectivity",
            "vertical_id": "telecom",
            "name": "IoT connectivity"
        }
    ]
};
exports.REGION_GENERATION = {
    "schema_version": "1.0.0",
    "data_sha256": "77408f1980d59e4247c24eb490a7cc4151e006c11807935c39df0e0827b9769a",
    "missing_regions": [
        "india",
        "southeast-asia",
        "middle-east",
        "uk",
        "western-europe",
        "north-america"
    ],
    "complete": false,
    "coverage": {
        "india": {
            "verticals": {
                "expected": 9,
                "specific": 0,
                "inherited": 0,
                "waiting_for_source": 0,
                "missing": 9,
                "duplicate": 0
            },
            "subtypes": {
                "expected": 57,
                "specific": 0,
                "inherited": 0,
                "waiting_for_source": 0,
                "missing": 57,
                "duplicate": 0
            }
        },
        "southeast-asia": {
            "verticals": {
                "expected": 9,
                "specific": 0,
                "inherited": 0,
                "waiting_for_source": 0,
                "missing": 9,
                "duplicate": 0
            },
            "subtypes": {
                "expected": 57,
                "specific": 0,
                "inherited": 0,
                "waiting_for_source": 0,
                "missing": 57,
                "duplicate": 0
            }
        },
        "middle-east": {
            "verticals": {
                "expected": 9,
                "specific": 0,
                "inherited": 0,
                "waiting_for_source": 0,
                "missing": 9,
                "duplicate": 0
            },
            "subtypes": {
                "expected": 57,
                "specific": 0,
                "inherited": 0,
                "waiting_for_source": 0,
                "missing": 57,
                "duplicate": 0
            }
        },
        "uk": {
            "verticals": {
                "expected": 9,
                "specific": 0,
                "inherited": 0,
                "waiting_for_source": 0,
                "missing": 9,
                "duplicate": 0
            },
            "subtypes": {
                "expected": 57,
                "specific": 0,
                "inherited": 0,
                "waiting_for_source": 0,
                "missing": 57,
                "duplicate": 0
            }
        },
        "western-europe": {
            "verticals": {
                "expected": 9,
                "specific": 0,
                "inherited": 0,
                "waiting_for_source": 0,
                "missing": 9,
                "duplicate": 0
            },
            "subtypes": {
                "expected": 57,
                "specific": 0,
                "inherited": 0,
                "waiting_for_source": 0,
                "missing": 57,
                "duplicate": 0
            }
        },
        "north-america": {
            "verticals": {
                "expected": 9,
                "specific": 0,
                "inherited": 0,
                "waiting_for_source": 0,
                "missing": 9,
                "duplicate": 0
            },
            "subtypes": {
                "expected": 57,
                "specific": 0,
                "inherited": 0,
                "waiting_for_source": 0,
                "missing": 57,
                "duplicate": 0
            }
        }
    }
};
//# sourceMappingURL=regions.js.map