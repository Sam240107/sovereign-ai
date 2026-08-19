import abc
from backend.app.execution.models import ExecutionRequest, ExecutionResponse

class FinancialProvider(abc.ABC):
    @abc.abstractmethod
    def execute_payout(self, request: ExecutionRequest) -> ExecutionResponse:
        pass

class ExecutionGateway:
    def __init__(self, provider: FinancialProvider):
        self.provider = provider

    def dispatch(self, request: ExecutionRequest) -> ExecutionResponse:
        """
        Routes the approved and audit-checked action to the underlying financial provider.
        """
        return self.provider.execute_payout(request)