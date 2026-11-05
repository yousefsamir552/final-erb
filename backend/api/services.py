from datetime import date, timedelta
from django.utils import timezone
from .models import (
    SystemSetting, Role, UserProfile, SizeDef, Supplier,
    Fabric, FabricColor, FabricTransaction,
    AccessoryType, Accessory, AccessoryTransaction,
    ModelItem, ModelRequirement, ModelAccessory, ModelTimeline,
    CuttingRecord, QCRecord, PrintDispatch,
    SewingDispatch, AppNotification, InternalMessage, AuditLog
)
from .serializers import resolve_by_id


DEFAULT_ROLES_SEED = [
    {
        'client_id': 'role-1',
        'name': 'مدير عام المصنع',
        'description': 'صلاحيات كاملة للمتابعة والإشراف على كافة أقسام المصنع والمخازن والماليات',
        'permissions': {
            'fabric_warehouse_view': True, 'fabric_warehouse_edit': True,
            'accessories_warehouse_view': True, 'accessories_warehouse_edit': True,
            'production_warehouse_view': True, 'production_warehouse_edit': True,
            'design_view': True, 'design_edit': True,
            'cutting_view': True, 'cutting_edit': True,
            'qc_view': True, 'qc_edit': True,
            'printing_view': True, 'printing_edit': True,
            'sewing_view': True, 'sewing_edit': True,
            'models_tracking_view': True, 'models_tracking_edit': True,
            'reports_view': True, 'reports_edit': True,
            'view_fabric_prices': True, 'edit_fabric_prices': True,
            'view_accessory_prices': True, 'edit_accessory_prices': True,
            'view_printing_costs': True, 'edit_printing_costs': True,
            'send_whatsapp_requests': True, 'send_internal_messages': True,
        }
    },
    {
        'client_id': 'role-2',
        'name': 'مدير الإكسسوارات والمستلزمات',
        'description': 'إدارة مخزن الإكسسوارات وإضافة الأصناف والصرف ومتابعة حد التنبيه وإعادة الطلب',
        'permissions': {
            'fabric_warehouse_view': False, 'fabric_warehouse_edit': False,
            'accessories_warehouse_view': True, 'accessories_warehouse_edit': True,
            'production_warehouse_view': False, 'production_warehouse_edit': False,
            'design_view': True, 'design_edit': False,
            'cutting_view': False, 'cutting_edit': False,
            'qc_view': False, 'qc_edit': False,
            'printing_view': False, 'printing_edit': False,
            'sewing_view': False, 'sewing_edit': False,
            'models_tracking_view': True, 'models_tracking_edit': False,
            'reports_view': True, 'reports_edit': False,
            'view_fabric_prices': False, 'edit_fabric_prices': False,
            'view_accessory_prices': True, 'edit_accessory_prices': True,
            'view_printing_costs': False, 'edit_printing_costs': False,
            'send_whatsapp_requests': True, 'send_internal_messages': True,
        }
    },
    {
        'client_id': 'role-3',
        'name': 'مسؤول مخزن الأقمشة',
        'description': 'إدارة أصناف وألوان الأقمشة وحركات الإضافة والصرف وتسجيل الأسعار',
        'permissions': {
            'fabric_warehouse_view': True, 'fabric_warehouse_edit': True,
            'accessories_warehouse_view': False, 'accessories_warehouse_edit': False,
            'production_warehouse_view': False, 'production_warehouse_edit': False,
            'design_view': True, 'design_edit': False,
            'cutting_view': False, 'cutting_edit': False,
            'qc_view': False, 'qc_edit': False,
            'printing_view': False, 'printing_edit': False,
            'sewing_view': False, 'sewing_edit': False,
            'models_tracking_view': True, 'models_tracking_edit': False,
            'reports_view': True, 'reports_edit': False,
            'view_fabric_prices': True, 'edit_fabric_prices': True,
            'view_accessory_prices': False, 'edit_accessory_prices': False,
            'view_printing_costs': False, 'edit_printing_costs': False,
            'send_whatsapp_requests': True, 'send_internal_messages': False,
        }
    },
    {
        'client_id': 'role-4',
        'name': 'مسؤول قسم التصميم',
        'description': 'إضافة الموديلات الجديدة وتلوينها وسحب الخامات والإكسسوارات وإعداد الباترون والماركر',
        'permissions': {
            'fabric_warehouse_view': True, 'fabric_warehouse_edit': False,
            'accessories_warehouse_view': True, 'accessories_warehouse_edit': False,
            'production_warehouse_view': False, 'production_warehouse_edit': False,
            'design_view': True, 'design_edit': True,
            'cutting_view': False, 'cutting_edit': False,
            'qc_view': False, 'qc_edit': False,
            'printing_view': False, 'printing_edit': False,
            'sewing_view': False, 'sewing_edit': False,
            'models_tracking_view': True, 'models_tracking_edit': False,
            'reports_view': False, 'reports_edit': False,
            'view_fabric_prices': False, 'edit_fabric_prices': False,
            'view_accessory_prices': False, 'edit_accessory_prices': False,
            'view_printing_costs': False, 'edit_printing_costs': False,
            'send_whatsapp_requests': False, 'send_internal_messages': True,
        }
    },
    {
        'client_id': 'role-5',
        'name': 'مسؤول قسم القص',
        'description': 'استلام الموديلات وتسجيل بيانات الفرش والراقات وعدد القطع المنفذة',
        'permissions': {
            'fabric_warehouse_view': False, 'fabric_warehouse_edit': False,
            'accessories_warehouse_view': False, 'accessories_warehouse_edit': False,
            'production_warehouse_view': False, 'production_warehouse_edit': False,
            'design_view': True, 'design_edit': False,
            'cutting_view': True, 'cutting_edit': True,
            'qc_view': False, 'qc_edit': False,
            'printing_view': False, 'printing_edit': False,
            'sewing_view': False, 'sewing_edit': False,
            'models_tracking_view': True, 'models_tracking_edit': False,
            'reports_view': False, 'reports_edit': False,
            'view_fabric_prices': False, 'edit_fabric_prices': False,
            'view_accessory_prices': False, 'edit_accessory_prices': False,
            'view_printing_costs': False, 'edit_printing_costs': False,
            'send_whatsapp_requests': False, 'send_internal_messages': False,
        }
    },
    {
        'client_id': 'role-6',
        'name': 'مراقب الجودة والفرز',
        'description': 'فحص وتدقيق القطع عبر مراحل العد قبل الطباعة، بعد الطباعة، وبعد المكن',
        'permissions': {
            'fabric_warehouse_view': False, 'fabric_warehouse_edit': False,
            'accessories_warehouse_view': False, 'accessories_warehouse_edit': False,
            'production_warehouse_view': False, 'production_warehouse_edit': False,
            'design_view': False, 'design_edit': False,
            'cutting_view': True, 'cutting_edit': False,
            'qc_view': True, 'qc_edit': True,
            'printing_view': True, 'printing_edit': False,
            'sewing_view': True, 'sewing_edit': False,
            'models_tracking_view': True, 'models_tracking_edit': False,
            'reports_view': True, 'reports_edit': False,
            'view_fabric_prices': False, 'edit_fabric_prices': False,
            'view_accessory_prices': False, 'edit_accessory_prices': False,
            'view_printing_costs': False, 'edit_printing_costs': False,
            'send_whatsapp_requests': False, 'send_internal_messages': False,
        }
    },
    {
        'client_id': 'role-7',
        'name': 'مسؤول المطابع والتطريز',
        'description': 'إرسال واستلام تشغيلات المطابع والتطريز وتتبع حالات التسليم',
        'permissions': {
            'fabric_warehouse_view': False, 'fabric_warehouse_edit': False,
            'accessories_warehouse_view': False, 'accessories_warehouse_edit': False,
            'production_warehouse_view': False, 'production_warehouse_edit': False,
            'design_view': False, 'design_edit': False,
            'cutting_view': False, 'cutting_edit': False,
            'qc_view': True, 'qc_edit': False,
            'printing_view': True, 'printing_edit': True,
            'sewing_view': False, 'sewing_edit': False,
            'models_tracking_view': True, 'models_tracking_edit': False,
            'reports_view': True, 'reports_edit': False,
            'view_fabric_prices': False, 'edit_fabric_prices': False,
            'view_accessory_prices': False, 'edit_accessory_prices': False,
            'view_printing_costs': True, 'edit_printing_costs': True,
            'send_whatsapp_requests': False, 'send_internal_messages': True,
        }
    },
    {
        'client_id': 'role-8',
        'name': 'مسؤول قسم المكن والخياطة',
        'description': 'متابعة خطوط المكن واستلام الموديلات بعد عد الطباعة وإتمام الخياطة',
        'permissions': {
            'fabric_warehouse_view': False, 'fabric_warehouse_edit': False,
            'accessories_warehouse_view': True, 'accessories_warehouse_edit': False,
            'production_warehouse_view': False, 'production_warehouse_edit': False,
            'design_view': True, 'design_edit': False,
            'cutting_view': False, 'cutting_edit': False,
            'qc_view': True, 'qc_edit': False,
            'printing_view': False, 'printing_edit': False,
            'sewing_view': True, 'sewing_edit': True,
            'models_tracking_view': True, 'models_tracking_edit': False,
            'reports_view': True, 'reports_edit': False,
            'view_fabric_prices': False, 'edit_fabric_prices': False,
            'view_accessory_prices': False, 'edit_accessory_prices': False,
            'view_printing_costs': False, 'edit_printing_costs': False,
            'send_whatsapp_requests': False, 'send_internal_messages': True,
        }
    }
]


def ensure_initial_seed():
    """
    Ensures the Sudo account and initial roles/catalog exist on first run ONLY.
    Once seeded, SystemSetting('initial_seed_v1') is stored so any user/account
    or model deletions performed by the admin are permanently respected across all browsers.
    Always guarantees that at least the 'sudo' account exists and has a valid password.
    """
    # 1. Always ensure Sudo role & Sudo account exist so admin is never locked out
    sudo_role = Role.objects.filter(client_id='role-1').first() or Role.objects.filter(name='مدير عام المصنع').first()
    if not sudo_role:
        sudo_role_data = DEFAULT_ROLES_SEED[0]
        sudo_role = Role(
            client_id=sudo_role_data['client_id'],
            name=sudo_role_data['name'],
            description=sudo_role_data['description'],
            permissions_json=sudo_role_data['permissions'],
        )
        sudo_role.save()

    sudo_user = UserProfile.objects.filter(username__iexact='sudo').first()
    if not sudo_user:
        sudo_user = UserProfile(
            client_id='user-sudo',
            username='sudo',
            real_name='حساب الإدارة العليا (Sudo)',
            phone='01000000000',
            role=sudo_role,
            role_title='مدير عام المصنع',
            is_sudo=True,
            is_active=True,
            custom_permissions={
                'warehouse': 'edit', 'design': 'edit', 'cutting': 'edit', 'qc': 'edit',
                'printing': 'edit', 'sewing': 'edit', 'models_tracking': 'edit',
                'fabric_warehouse': 'edit', 'accessories_warehouse': 'edit',
                'production_warehouse': 'edit', 'reports': 'edit',
                'view_fabric_prices': True, 'edit_fabric_prices': True,
                'view_accessory_prices': True, 'edit_accessory_prices': True,
                'view_printing_costs': True, 'edit_printing_costs': True,
                'send_whatsapp_requests': True, 'send_internal_messages': True,
            },
            last_active=timezone.now(),
        )
        sudo_user.set_password('14596357')
        sudo_user.save()
    elif not sudo_user.password_hash:
        sudo_user.set_password('14596357')
        sudo_user.is_sudo = True
        sudo_user.is_active = True
        if not sudo_user.client_id:
            sudo_user.client_id = 'user-sudo'
        sudo_user.save()

    # Check if one-time seed has already run
    if SystemSetting.objects.filter(key='initial_seed_v1').exists():
        return

    # Seed default roles if missing
    for r_data in DEFAULT_ROLES_SEED:
        if not Role.objects.filter(name=r_data['name']).exists():
            role_obj = Role(
                client_id=r_data['client_id'],
                name=r_data['name'],
                description=r_data['description'],
                permissions_json=r_data['permissions'],
            )
            role_obj.save()

    # Seed default size definitions if empty
    if not SizeDef.objects.exists():
        for cid, name, vals in [
            ('size-1', 'بيبي', '1, 2, 3'),
            ('size-2', 'أطفال / وسط', '4, 6, 8, 10, 12'),
            ('size-3', 'شبابي', '14, 16, 18'),
            ('size-4', 'رجالي', 'S, M, L, XL, 2XL, 3XL'),
        ]:
            SizeDef.objects.create(client_id=cid, name=name, values=vals)

    # Seed default suppliers if empty
    if not Supplier.objects.exists():
        for cid, name, phone in [
            ('sup-1', 'شركة النسيج الحديث للمحلة', '01002345678'),
            ('sup-2', 'مؤسسة الأهرام للغزول والصباغة', '01129876543'),
            ('sup-3', 'مستودع إكسسوارات الفهد', '01234567890'),
        ]:
            Supplier.objects.create(client_id=cid, name=name, phone=phone)

    # Seed default accessory types if empty
    if not AccessoryType.objects.exists():
        for cid, name, icon, desc in [
            ('type-1', 'بادج', 'Shield', 'بادجات تطريز وسيليكون وليزر للأكمام والصدور والجيوب'),
            ('type-2', 'لعبة', 'Sparkles', 'ألعاب ملابس أطفال وميداليات وحليات قماشية'),
            ('type-3', 'ورد', 'Flower2', 'ورود شيفون وستان وفيونكات للأطواق والفساتين'),
            ('type-4', 'دانتيل وتطريز', 'Feather', 'شرايط دانتيل قطني وجبير وتطريزات جاهزة'),
            ('type-5', 'تيكت وعلامات', 'Tag', 'تيكت رقبة قطني منسوج وكروت مقاس وعناية'),
            ('type-6', 'سوست ومستلزمات', 'Minimize2', 'سوست عظم ومعدن وجرارات وإكسسوارات سحاب'),
        ]:
            AccessoryType.objects.create(client_id=cid, name=name, icon=icon, description=desc)

    if not AuditLog.objects.exists():
        AuditLog.objects.create(
            client_id='log-1',
            user_id_ref='user-sudo',
            user_name='مدير النظام (Sudo)',
            action='تهيئة النظام',
            details='تشغيل نظام إدارة المصنع وربط قاعدة البيانات المركزية بنجاح',
            ip_address='127.0.0.1',
            timestamp=timezone.now().strftime('%Y-%m-%d %H:%M'),
        )

    SystemSetting.objects.create(key='initial_seed_v1', value={'seeded': True})


def get_accessory_deficits():
    """
    Computes stock deficits and model-specific deficits separately.
    """
    accessories = Accessory.objects.all()
    stock_deficits = []
    model_deficits = []

    for item in accessories:
        ext_id = item.client_id or str(item.id)
        if item.usage_type == 'custom_model':
            if item.withdrawn_for_model:
                continue
            deficit = max(0, item.target_quantity - item.delivered_quantity)
            if deficit > 0:
                model_deficits.append({
                    'id': ext_id,
                    'code': item.code or item.custom_model_code or 'خاص',
                    'name': item.name,
                    'usage_type': 'custom_model',
                    'custom_model_code': item.custom_model_code,
                    'current_stock': item.current_stock,
                    'delivered_quantity': item.delivered_quantity,
                    'target_quantity': item.target_quantity,
                    'deficit': deficit,
                    'unit': item.unit,
                    'supplier': item.supplier
                })
        else:
            deficit = max(0, item.min_threshold - item.current_stock)
            if item.current_stock <= item.min_threshold:
                stock_deficits.append({
                    'id': ext_id,
                    'code': item.code or f"ACC-{item.id}",
                    'name': item.name,
                    'usage_type': 'stock',
                    'current_stock': item.current_stock,
                    'min_threshold': item.min_threshold,
                    'deficit': deficit,
                    'unit': item.unit,
                    'supplier': item.supplier
                })

    return {
        'stock_deficits': stock_deficits,
        'model_deficits': model_deficits,
        'total_count': len(stock_deficits) + len(model_deficits)
    }


def generate_smart_delivery_notifications():
    """
    Computes delivery date notifications for PrintDispatches and SewingDispatches:
    - 1 day before: Tomorrow notification
    - On date: Today notification
    - Past date without receipt: Overdue (stays active until received)
    """
    today = date.today()
    tomorrow = today + timedelta(days=1)
    notifications = []

    # 1. Print Dispatches
    active_prints = PrintDispatch.objects.exclude(status__in=['تم الاستلام', 'تم الاستلام بالمصنع']).select_related('model')
    for disp in active_prints:
        if not disp.expected_delivery_date:
            continue
        exp = disp.expected_delivery_date
        code = disp.model.model_code
        m_ext_id = disp.model.client_id or str(disp.model_id)
        d_ext_id = disp.client_id or str(disp.id)
        if exp < today:
            days = (today - exp).days
            notifications.append({
                'id': f"notif-print-{d_ext_id}-{exp.isoformat()}",
                'title': f'🚨 تأخر استلام من المطبعة ({code})',
                'urgency': 'overdue',
                'stage': 'printing',
                'model_code': code,
                'model_id': m_ext_id,
                'source_name': disp.print_house,
                'target_name': disp.print_house,
                'expected_date': exp.isoformat(),
                'days_diff': -days,
                'message': f"تخطى موعد استلام الموديل {code} من مطبعة {disp.print_house} بمقدار {days} يوم، ولم يتم تسجيل الاستلام بعد!"
            })
        elif exp == today:
            notifications.append({
                'id': f"notif-print-{d_ext_id}-{exp.isoformat()}",
                'title': f'⏰ موعد استلام اليوم ({code})',
                'urgency': 'today',
                'stage': 'printing',
                'model_code': code,
                'model_id': m_ext_id,
                'source_name': disp.print_house,
                'target_name': disp.print_house,
                'expected_date': exp.isoformat(),
                'days_diff': 0,
                'message': f"اليوم هو موعد استلام تشغيلة الموديل {code} من مطبعة {disp.print_house} ({disp.pieces_count} قطعة)."
            })
        elif exp == tomorrow:
            notifications.append({
                'id': f"notif-print-{d_ext_id}-{exp.isoformat()}",
                'title': f'📅 موعد استلام غداً ({code})',
                'urgency': 'tomorrow',
                'stage': 'printing',
                'model_code': code,
                'model_id': m_ext_id,
                'source_name': disp.print_house,
                'target_name': disp.print_house,
                'expected_date': exp.isoformat(),
                'days_diff': 1,
                'message': f"غداً موعد استلام الموديل {code} من مطبعة {disp.print_house}."
            })

    # 2. Sewing Dispatches
    active_sewing = SewingDispatch.objects.exclude(status='تم الاستلام').select_related('model')
    for disp in active_sewing:
        if not disp.expected_delivery_date:
            continue
        exp = disp.expected_delivery_date
        code = disp.model.model_code
        m_ext_id = disp.model.client_id or str(disp.model_id)
        d_ext_id = disp.client_id or str(disp.id)
        piece_suffix = f" [{disp.piece_label or ('تيشرت' if disp.piece_type == 'shirt' else 'بنطلون')}]"

        if exp < today:
            days = (today - exp).days
            notifications.append({
                'id': f"notif-sew-{d_ext_id}-{exp.isoformat()}",
                'title': f"🚨 تأخر استلام من ورشة المكن{piece_suffix} ({code})",
                'urgency': 'overdue',
                'stage': 'sewing',
                'model_code': code,
                'model_id': m_ext_id,
                'source_name': disp.workshop_name,
                'target_name': disp.workshop_name,
                'expected_date': exp.isoformat(),
                'days_diff': -days,
                'message': f"تخطى موعد استلام {code}{piece_suffix} من ورشة {disp.workshop_name} بمقدار {days} يوم، ولم يتم تسجيل الاستلام بعد!"
            })
        elif exp == today:
            notifications.append({
                'id': f"notif-sew-{d_ext_id}-{exp.isoformat()}",
                'title': f"⏰ موعد استلام اليوم{piece_suffix} ({code})",
                'urgency': 'today',
                'stage': 'sewing',
                'model_code': code,
                'model_id': m_ext_id,
                'source_name': disp.workshop_name,
                'target_name': disp.workshop_name,
                'expected_date': exp.isoformat(),
                'days_diff': 0,
                'message': f"اليوم هو موعد استلام تشغيلة الموديل {code}{piece_suffix} من ورشة المكن ({disp.workshop_name}) - عدد {disp.pieces_count} قطعة."
            })
        elif exp == tomorrow:
            notifications.append({
                'id': f"notif-sew-{d_ext_id}-{exp.isoformat()}",
                'title': f"📅 موعد استلام غداً{piece_suffix} ({code})",
                'urgency': 'tomorrow',
                'stage': 'sewing',
                'model_code': code,
                'model_id': m_ext_id,
                'source_name': disp.workshop_name,
                'target_name': disp.workshop_name,
                'expected_date': exp.isoformat(),
                'days_diff': 1,
                'message': f"غداً موعد استلام الموديل {code}{piece_suffix} من ورشة الخياطة ({disp.workshop_name})."
            })

    urgency_weights = {'overdue': 0, 'today': 1, 'tomorrow': 2}
    notifications.sort(key=lambda n: urgency_weights.get(n['urgency'], 3))
    return notifications


def dispatch_model_to_sewing_service(
    model_id, workshop_name, pieces_count, expected_delivery_date,
    notes=None, user_name='مدير الإنتاج', piece_type='shirt', piece_label=None, client_id=None
):
    """
    Records sewing dispatch and moves model into sewing stage with independent piece tracking.
    """
    model = resolve_by_id(ModelItem, model_id)
    if not model:
        raise ValueError("الموديل غير موجود")
    resolved_label = piece_label or ('تيشرت' if piece_type == 'shirt' else 'بنطلون')

    if piece_type == 'shirt':
        model.sewing_shirt_workshop = workshop_name
        model.sewing_shirt_expected_date = expected_delivery_date
        model.sewing_shirt_status = 'في ورشة المكن'
        model.sewing_shirt_pieces = pieces_count
    else:
        model.sewing_pants_workshop = workshop_name
        model.sewing_pants_expected_date = expected_delivery_date
        model.sewing_pants_status = 'في ورشة المكن'
        model.sewing_pants_pieces = pieces_count

    model.sewing_workshop = workshop_name
    model.sewing_expected_date = expected_delivery_date
    model.sewing_pieces_count = pieces_count
    model.status = 'في قسم المكن'
    model._skip_timeline_signal = True
    model.save()

    now_str = timezone.now().strftime('%Y-%m-%d %H:%M')
    dispatch = SewingDispatch.objects.create(
        client_id=client_id,
        model=model,
        piece_type=piece_type,
        piece_label=resolved_label,
        workshop_name=workshop_name,
        pieces_count=pieces_count,
        expected_delivery_date=expected_delivery_date,
        dispatched_at_str=now_str,
        status='في ورشة المكن',
        notes=notes or ''
    )

    ModelTimeline.objects.create(
        model=model,
        stage='قسم المكن والخياطة',
        title=f'إرسال [{resolved_label}] إلى ورشة المكن: {workshop_name}',
        user=user_name,
        timestamp_str=now_str,
        notes=f"تم إرسال {pieces_count} قطعة [{resolved_label}] للخياطة إلى ورشة ({workshop_name})، تاريخ الاستلام المتوقع: {expected_delivery_date}"
    )

    return dispatch


def receive_model_from_sewing_service(dispatch_id, user_name='مراقب الجودة'):
    """
    Receives model from sewing workshop and routes it to QC (العد بعد المكن).
    """
    dispatch = resolve_by_id(SewingDispatch, dispatch_id)
    if not dispatch:
        raise ValueError("إرسالية الخياطة غير موجودة")
    now_str = timezone.now().strftime('%Y-%m-%d %H:%M')
    dispatch.status = 'تم الاستلام'
    dispatch.received_date = date.today()
    dispatch.received_at_str = now_str
    dispatch.save()

    model = dispatch.model
    if dispatch.piece_type == 'shirt':
        model.sewing_shirt_status = 'تم الاستلام'
    else:
        model.sewing_pants_status = 'تم الاستلام'

    other_pending = SewingDispatch.objects.filter(model=model).exclude(id=dispatch.id).exclude(status='تم الاستلام').exists()
    all_done = not other_pending

    if all_done:
        model.status = 'العد بعد المكن'
    model._skip_timeline_signal = True
    model.save()

    label = dispatch.piece_label or ('تيشرت' if dispatch.piece_type == 'shirt' else 'بنطلون')
    ModelTimeline.objects.create(
        model=model,
        stage='قسم المكن والفرز',
        title=f'استلام [{label}] من ورشة المكن',
        user=user_name,
        timestamp_str=now_str,
        notes=f"تم استلام {dispatch.pieces_count} قطعة [{label}] من ورشة {dispatch.workshop_name}{' واكتمال القطع وتوجيه الموديل تلقائياً إلى الفرز والجودة (العد بعد المكن)' if all_done else ''}"
    )

    return dispatch
