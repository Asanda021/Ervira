# ERVIRA Product Source of Truth

StructuralPro owns the canonical product contract in its GitHub repository.

ERVIRA stores only a derived mirror for static-site delivery. The mirror is not authoritative.

The parity gate fetches the canonical contract from StructuralPro and compares product identity, capability status, edition status and release/download metadata with the ERVIRA mirror.

A mismatch blocks CI.
