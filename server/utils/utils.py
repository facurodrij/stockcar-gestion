import pytz
from sqlalchemy import Column, func, DateTime, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declared_attr
from flask_sqlalchemy.query import Query
from server.auth.models import Usuario


local_tz = pytz.timezone("America/Argentina/Buenos_Aires")


class AuditMixin:
    """
    Clase que agrega campos de auditoria a las tablas de la base de datos.
    """

    @declared_attr
    def created_at(cls):
        return Column(DateTime, default=func.now(), nullable=False)

    @declared_attr
    def updated_at(cls):
        return Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    @declared_attr
    def created_by(cls):
        return Column(Integer, ForeignKey("usuario.id"), nullable=False)

    @declared_attr
    def updated_by(cls):
        return Column(Integer, ForeignKey("usuario.id"), nullable=False)

    @declared_attr
    def created_by_user(cls):
        return relationship(Usuario, foreign_keys=[cls.created_by])

    @declared_attr
    def updated_by_user(cls):
        return relationship(Usuario, foreign_keys=[cls.updated_by])

    def __init__(self, *args, **kwargs):
        super(AuditMixin, self).__init__(*args, **kwargs)

    def get_audit_fields(self) -> dict:
        """
        Devuelve los campos de auditoría en formato JSON.
        """
        return {
            "created_at": self.created_at.replace(tzinfo=pytz.utc)
            .astimezone(local_tz)
            .isoformat(),
            "updated_at": self.updated_at.replace(tzinfo=pytz.utc)
            .astimezone(local_tz)
            .isoformat(),
            "created_by": self.created_by_user.to_dict(),
            "updated_by": self.updated_by_user.to_dict(),
        }


class SoftDeleteMixin:
    """
    Clase que agrega un campo de eliminación lógica a las tablas de la base de datos.
    """

    @declared_attr
    def deleted(cls):
        return Column(Boolean, default=False, nullable=False)

    @declared_attr
    def deleted_at(cls):
        return Column(DateTime, nullable=True)

    def __init__(self, *args, **kwargs):
        super(SoftDeleteMixin, self).__init__(*args, **kwargs)

    def delete(self):
        self.deleted = True
        self.deleted_at = func.now()

    def restore(self):
        self.deleted = False
        self.deleted_at = None

    def is_deleted(self):
        return self.deleted


class QueryWithSoftDelete(Query):
    _with_deleted = False

    def __init__(self, *args, **kwargs):
        self._with_deleted = kwargs.pop("_with_deleted", False)
        super(QueryWithSoftDelete, self).__init__(*args, **kwargs)
        if not self._with_deleted:
            self = self.filter_by(deleted=False)

    def with_deleted(self):
        return self.__class__(
            self._only_full_mapper_zero("get"), session=self.session, _with_deleted=True
        )

    def __iter__(self):
        if not self._with_deleted:
            self = self.filter_by(deleted=False)
        return super(QueryWithSoftDelete, self).__iter__()

    def _get(self, *args, **kwargs):
        # this calls the original query.get function from the base class
        return super(QueryWithSoftDelete, self).get(*args, **kwargs)

    def get(self, *args, **kwargs):
        # the query.get method does not like it if there is a filter clause
        # pre-loaded, so we need to implement it using a workaround
        obj = self.with_deleted()._get(*args, **kwargs)
        return obj if obj is None or self._with_deleted or not obj.deleted else None

    def get_or_404(self, ident, description: str | None = None):
        rv = self.with_deleted().get(ident)
        if rv is None or (not self._with_deleted and rv.deleted):
            from flask import abort

            abort(404, description=description)
        return rv

    def first(self):
        if not self._with_deleted:
            self = self.filter_by(deleted=False)
        return super(QueryWithSoftDelete, self).first()

    def all(self):
        # Para evitar el error: Query.filter() being called on a Query which already has LIMIT or OFFSET applied.  Call filter() before limit() or offset() are applied.
        # Se verifica si la query no posee limit o offset clauses antes de agregar la cláusula where deleted = false
        if not self._limit_clause is not None or not self._offset_clause is not None:
            if not self._with_deleted:
                self = self.filter_by(deleted=False)
        return super(QueryWithSoftDelete, self).all()

    def paginate(
        self, *, page=None, per_page=None, max_per_page=None, error_out=True, count=True
    ):
        if not self._with_deleted:
            self = self.filter_by(deleted=False)
        return super(QueryWithSoftDelete, self).paginate(
            page=page,
            per_page=per_page,
            max_per_page=max_per_page,
            error_out=error_out,
            count=count,
        )


def get_select_options(models: list = []) -> dict:
    """
    Obtiene los datos necesarios para los campos select de los formularios de usuarios.
    """
    select_options = {}

    for model in models:
        model_name = model.__pluralname__
        records = model.query.all()
        select_options[model_name] = list(map(lambda x: x.to_select_dict(), records))

    return select_options


def get_datagrid_options(models: list = []) -> dict:
    """
    Obtiene los datos necesarios para las columnas de los datagrid en los formularios de usuarios.
    """
    datagrid_options = {}

    for model in models:
        model_name = model.__pluralname__
        records = model.query.all()
        datagrid_options[model_name] = list(
            map(lambda x: x.to_datagrid_dict(), records)
        )

    return datagrid_options
